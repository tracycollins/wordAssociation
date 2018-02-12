from __future__ import absolute_import, division, print_function, unicode_literals

import json
import six
import sys

from stone.ir import (
    is_user_defined_type,
    is_union_type,
    is_struct_type,
    is_void_type,
    unwrap,
)
from stone.backend import CodeBackend
from stone.backends.js_helpers import (
    fmt_jsdoc_union,
    fmt_type,
    fmt_type_name,
)

_MYPY = False
if _MYPY:
    import typing  # noqa: F401 # pylint: disable=import-error,unused-import,useless-suppression

# Hack to get around some of Python 2's standard library modules that
# accept ascii-encodable unicode literals in lieu of strs, but where
# actually passing such literals results in errors with mypy --py2. See
# <https://github.com/python/typeshed/issues/756> and
# <https://github.com/python/mypy/issues/2536>.
import importlib
argparse = importlib.import_module(str('argparse'))  # type: typing.Any


_cmdline_parser = argparse.ArgumentParser(prog='js-types-backend')
_cmdline_parser.add_argument(
    'filename',
    help=('The name to give the single Javascript file that is created and '
          'contains all of the JSDoc types.'),
)
_cmdline_parser.add_argument(
    '-e',
    '--extra-arg',
    action='append',
    type=str,
    default=[],
    help=("Additional properties to add to a route's argument type based "
          "on if the route has a certain attribute set. Format (JSON): "
          '{"match": ["ROUTE_ATTR", ROUTE_VALUE_TO_MATCH], '
          '"arg_name": "ARG_NAME", "arg_type": "ARG_TYPE", '
          '"arg_docstring": "ARG_DOCSTRING"}'),
)

_header = """\
// Auto-generated by Stone, do not modify.
/**
 * An Error object returned from a route.
 * @typedef {Object} Error
 * @property {string} error_summary - Text summary of the error.
 * @property {T} error - The error object.
 * @property {UserMessage} user_message - An optional field. If present, it includes a 
    message that can be shown directly to the end user of your app. You should show this message
    if your app is unprepared to programmatically handle the error returned by an endpoint.
 * @template T
 */

/**
 * User-friendly error message.
 * @typedef {Object} UserMessage
 * @property {string} text - The message.
 * @property {string} locale
 */

 /**
  * @typedef {string} Timestamp
  */
"""


class JavascriptTypesBackend(CodeBackend):
    """Generates a single Javascript file with all of the data types defined in JSDoc."""

    cmdline_parser = _cmdline_parser

    preserve_aliases = True

    def generate(self, api):
        with self.output_to_relative_path(self.args.filename):

            self.emit_raw(_header)

            extra_args = self._parse_extra_args(api, self.args.extra_arg)

            for namespace in api.namespaces.values():
                for data_type in namespace.data_types:
                    self._generate_type(data_type, extra_args.get(data_type, []))

    def _parse_extra_args(self, api, extra_args_raw):
        """
        Parses extra arguments into a map keyed on particular data types.
        """
        extra_args = {}

        def die(m, extra_arg_raw):
            print('Invalid --extra-arg:%s: %s' % (m, extra_arg_raw),
                  file=sys.stderr)
            sys.exit(1)

        for extra_arg_raw in extra_args_raw:
            try:
                extra_arg = json.loads(extra_arg_raw)
            except ValueError as e:
                die(str(e), extra_arg_raw)

            # Validate extra_arg JSON blob
            if 'match' not in extra_arg:
                die('No match key', extra_arg_raw)
            elif (not isinstance(extra_arg['match'], list) or
                    len(extra_arg['match']) != 2):
                die('match key is not a list of two strings', extra_arg_raw)
            elif (not isinstance(extra_arg['match'][0], six.text_type) or
                    not isinstance(extra_arg['match'][1], six.text_type)):
                print(type(extra_arg['match'][0]))
                die('match values are not strings', extra_arg_raw)
            elif 'arg_name' not in extra_arg:
                die('No arg_name key', extra_arg_raw)
            elif not isinstance(extra_arg['arg_name'], six.text_type):
                die('arg_name is not a string', extra_arg_raw)
            elif 'arg_type' not in extra_arg:
                die('No arg_type key', extra_arg_raw)
            elif not isinstance(extra_arg['arg_type'], six.text_type):
                die('arg_type is not a string', extra_arg_raw)
            elif ('arg_docstring' in extra_arg and
                    not isinstance(extra_arg['arg_docstring'], six.text_type)):
                die('arg_docstring is not a string', extra_arg_raw)

            attr_key, attr_val = extra_arg['match'][0], extra_arg['match'][1]

            extra_args.setdefault(attr_key, {})[attr_val] = \
                (extra_arg['arg_name'], extra_arg['arg_type'],
                 extra_arg.get('arg_docstring'))

        # Extra arguments, keyed on data type objects.
        extra_args_for_types = {}
        # Locate data types that contain extra arguments
        for namespace in api.namespaces.values():
            for route in namespace.routes:
                extra_parameters = []
                if is_user_defined_type(route.arg_data_type):
                    for attr_key in route.attrs:
                        if attr_key not in extra_args:
                            continue
                        attr_val = route.attrs[attr_key]
                        if attr_val in extra_args[attr_key]:
                            extra_parameters.append(extra_args[attr_key][attr_val])
                if len(extra_parameters) > 0:
                    extra_args_for_types[route.arg_data_type] = extra_parameters

        return extra_args_for_types

    def _generate_type(self, data_type, extra_parameters):
        if is_struct_type(data_type):
            self._generate_struct(data_type, extra_parameters)
        elif is_union_type(data_type):
            self._generate_union(data_type)

    def _emit_jsdoc_header(self, doc=None):
        self.emit()
        self.emit('/**')
        if doc:
            self.emit_wrapped_text(self.process_doc(doc, self._docf), prefix=' * ')

    def _generate_struct(self, struct_type, extra_parameters=None, nameOverride=None):
        """
        Emits a JSDoc @typedef for a struct.
        """
        extra_parameters = extra_parameters if extra_parameters is not None else []
        self._emit_jsdoc_header(struct_type.doc)
        self.emit(
            ' * @typedef {Object} %s' % (
                nameOverride if nameOverride else fmt_type_name(struct_type)
            )
        )

        # Some structs can explicitly list their subtypes. These structs
        # have a .tag field that indicate which subtype they are.
        if struct_type.is_member_of_enumerated_subtypes_tree():
            if struct_type.has_enumerated_subtypes():
                # This struct is the parent to multiple subtypes.
                # Determine all of the possible values of the .tag
                # property.
                tag_values = []
                for tags, _ in struct_type.get_all_subtypes_with_tags():
                    for tag in tags:
                        tag_values.append('"%s"' % tag)

                jsdoc_tag_union = fmt_jsdoc_union(tag_values)
                txt = '@property {%s} .tag - Tag identifying the subtype variant.' % \
                    jsdoc_tag_union
                self.emit_wrapped_text(txt)
            else:
                # This struct is a particular subtype. Find the applicable
                # .tag value from the parent type, which may be an
                # arbitrary number of steps up the inheritance hierarchy.
                parent = struct_type.parent_type
                while not parent.has_enumerated_subtypes():
                    parent = parent.parent_type
                # parent now contains the closest parent type in the
                # inheritance hierarchy that has enumerated subtypes.
                # Determine which subtype this is.
                for subtype in parent.get_enumerated_subtypes():
                    if subtype.data_type == struct_type:
                        txt = '@property {\'%s\'} [.tag] - Tag identifying ' \
                            'this subtype variant. This field is only ' \
                            'present when needed to discriminate ' \
                            'between multiple possible subtypes.' % \
                            subtype.name
                        self.emit_wrapped_text(txt)
                        break

        for param_name, param_type, param_docstring in extra_parameters:
            param_docstring = ' - %s' % param_docstring if param_docstring else ''
            self.emit_wrapped_text(
                '@property {%s} %s%s' % (
                    param_type,
                    param_name,
                    param_docstring,
                ),
                prefix=' * ',
            )

        # NOTE: JSDoc @typedef does not support inheritance. Using @class would be inappropriate,
        # since these are not nominal types backed by a constructor. Thus, we emit all_fields,
        # which includes fields on parent types.
        for field in struct_type.all_fields:
            field_doc = ' - ' + field.doc if field.doc else ''
            field_type, nullable, _ = unwrap(field.data_type)
            field_js_type = fmt_type(field_type)
            # Translate nullable types into optional properties.
            field_name = '[' + field.name + ']' if nullable else field.name
            self.emit_wrapped_text(
                '@property {%s} %s%s' % (
                    field_js_type,
                    field_name,
                    self.process_doc(field_doc, self._docf),
                ),
                prefix=' * ',
            )

        self.emit(' */')

    def _generate_union(self, union_type):
        """
        Emits a JSDoc @typedef for a union type.
        """
        union_name = fmt_type_name(union_type)
        self._emit_jsdoc_header(union_type.doc)
        self.emit(' * @typedef {Object} %s' % union_name)
        variant_types = []
        for variant in union_type.all_fields:
            variant_types.append("'%s'" % variant.name)
            variant_data_type, _, _ = unwrap(variant.data_type)
            # Don't emit fields for void types.
            if not is_void_type(variant_data_type):
                variant_doc = ' - Available if .tag is %s.' % variant.name
                if variant.doc:
                    variant_doc += ' ' + variant.doc
                self.emit_wrapped_text(
                    '@property {%s} [%s]%s' % (
                        fmt_type(variant_data_type),
                        variant.name,
                        variant_doc,
                    ),
                    prefix=' * ',
                )
        jsdoc_tag_union = fmt_jsdoc_union(variant_types)
        self.emit(' * @property {%s} .tag - Tag identifying the union variant.' % jsdoc_tag_union)
        self.emit(' */')

    def _docf(self, tag, val):  # pylint: disable=unused-argument
        """
        Callback used as the handler argument to process_docs(). This converts
        Stone doc references to JSDoc-friendly annotations.
        """
        # TODO(kelkabany): We're currently just dropping all doc ref tags.
        return val
