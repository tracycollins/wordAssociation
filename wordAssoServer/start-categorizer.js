const args = [ 'start' ];
const opts = { stdio: 'inherit', cwd: 'categorizer', shell: true };
require('child_process').spawn('npm', args, opts);
