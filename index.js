let history = [];
let back = [];
let hist_id = 0;
let dark_mode = 0;
let restore = '';
let user = '';
let ls = '';
let env = {
  'PWD': '/',
  'USER': 'guest',
  'HOME': '/',
  'TERM': window.navigator.userAgent.replace(/[^\s]+\s(?:\([^\)]+\)\s)?[^\s]+\s(?:\([^\)]+\)\s)?([^\/]*).*/, '$1'),
  'HOSTNAME': 'mer.tz',
  'SHELL': 'fakeshell'
};

const loadFile = function (path, response) {
  var request = new XMLHttpRequest();
  request.overrideMimeType("application/html");
  return new Promise((resolve, reject) => {
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status === 200) {
          data = request.responseText.split('|||');
          if (data.length == 0) {
            response();
            return;
          } else if (data.length > 1) {
            output = '';
            i = 0;
            response(data.length);
            data.forEach(function (a) {
              if (i % 2) {
                let e = '';
                try {
                  e = eval(a);
                }
                catch (err) {
                  e = '<span title="'+err.message+": '"+a+"'"+'">INVALID_JS</span>';
                }
                output += e;
              } else {
                if (a.match(/^<title>*/) != null) {
                  response();
                  return;
                }
                output += a;
              }
              i++;
            });

            response(output);
          } else {
            response(request.responseText);
          }
        } else {
          response();
        }
      }
    }
    request.open('GET', path, true);
    request.send()
  });
}

function open_hover(path) {
  restore = input.innerHTML;
  input.innerHTML = 'open ' + path;
}

function open_link(path) {
  options = '';
  if (path.match(/^http/) != null) options += 'noreferrer';
  window.open(path, '_blank', options).focus();
}

function img_hover(path) {
  restore = input.innerHTML;
  input.innerHTML = 'img ' + path;
}

function img_link(path, width = 0, height = 0) {
  options = 'location=yes';
  target = 'mer.tz-image';
  if (width) options += ',innerWidth=' + width;
  if (height) options += ',innerHeight=' + height;
  if (width || height) options += ',scrollbars=no';
  if (path.match(/^http/) != null) {
    options += ',noreferrer';
    target = '_blank';
  }
  window.open(path, target, options + ',left=0').focus();
}

function cat_hover(path) {
  restore = input.innerHTML;
  input.innerHTML = 'cat ' + path;
}

function cat_link(path) {
  runcmd("cat "+path);
}

function cd_hover(path) {
  restore = input.innerHTML;
  input.innerHTML = 'cd ' + path;
}

function cd_link(path) {
  runcmd('cd ' + path);
}

function restore_input() {
  input.innerHTML = restore;
  restore = '';
}

var link = document.querySelector("link[rel~='icon']");
async function blink(on) {
  if (on) {
    link.href = '/favicon-blink.png';
    if (dark_mode) link.href = '/favicon-blink-dark.png';
  } else {
    link.href = '/favicon-off.png';
    if (dark_mode) link.href = '/favicon-off-dark.png';
  }
  await new Promise(r => setTimeout(r, 1000));
  blink(!on);
}

async function try_cat(file, cd, wait) {
  let original = file;
  let mycd = cd;
  if (mycd) {
    if (file == '/') {
      file = 'index.md';
    } else {
      file += '/index.md'
    }
  } else {
    if (!file.match(/^\//)) {
      file = env['PWD']+(env['PWD'] == '/' ? '' : '/')+file;
    }
    file += '.md'
  }
  await loadFile(file, function (md) {
    w = document.getElementById('history_' + wait);
    if (md) {
      html = md2html(md, mycd);
      if (mycd) {
        ls = '';
        lsl = '';
        sizes = {};
        Object.keys(html.meta.ls).forEach(function (a) {
          Object.keys(html.meta.ls[a]).forEach(function (b) {
            if (sizes[b] === undefined || sizes[b] < html.meta.ls[a][b].length) {
              sizes[b] = html.meta.ls[a][b].length;
            }
          });
        });
        Object.keys(html.meta.ls).sort().forEach(function (a) {
          color = a;
          if (html.meta.ls[a]["perm"].match(/^d/)) color = '<span style="color: var(--blue)">'+a+'</span>';
          ls += color+"<br>";
          lsl += html.meta.ls[a]["perm"] + " " + html.meta.ls[a]["links"] + " " + "&nbsp;".repeat(sizes["user"]-html.meta.ls[a]["user"].length) + html.meta.ls[a]["user"] + " " + "&nbsp;".repeat(sizes["group"]-html.meta.ls[a]["group"].length) + html.meta.ls[a]["group"] + " " + "&nbsp;".repeat(sizes["size"]-html.meta.ls[a]["size"].length) + html.meta.ls[a]["size"] + " " + "&nbsp;".repeat(sizes["modified"]-html.meta.ls[a]["modified"].length) + html.meta.ls[a]["modified"] + " " + color + "<br>";
        });
        lsa = '<span style="color: var(--blue)">.</span><br><span style="color: var(--blue)">..</span><br>'+ls;
        lsal = 'dr-xr-xr-x. 1 ' + "&nbsp;".repeat(sizes["user"]-5) + 'guest ' + "&nbsp;".repeat(sizes["group"]-5) + 'guest ' + "&nbsp;".repeat(sizes["size"]-4) + '4096 ' + "&nbsp;".repeat(sizes["modified"]-12) + "Jan  1  1970" + " .<br>";
        lsal += 'dr-xr-xr-x. 1 ' + "&nbsp;".repeat(sizes["user"]-5) + 'guest ' + "&nbsp;".repeat(sizes["group"]-5) + 'guest ' + "&nbsp;".repeat(sizes["size"]-4) + '4096 ' + "&nbsp;".repeat(sizes["modified"]-12) + "Jan  1  1970" + " ..<br>";
        lsal += lsl;
        if (original == '') {
          original = '/';
        }
        if (mycd) {
          env['OLDPWD'] = env['PWD'];
          env['PWD'] = original;
        }
      } else {
        console.log("TODO: Process 'cat' metadata");
      }
      w.innerHTML = html.cat_text;
    } else {
      if (mycd) {
        w.innerHTML = env['SHELL'] + ': cd: ' + original + ': No such file or directory';
      } else {
        w.innerHTML = env['SHELL'] + ': cat: ' + original + ': No such file or directory';
      }
    }
    currentPS1.innerHTML = '<span id="PS1USER">' + env['USER'] + '</span>' + basePS1 + '<span id="PS1COLON">:</span><span id="PS1PATH">' + env['PWD'] + '</span><span id="PS1PROMPT">$</span> ';
  });
}

var commands = {
  'cat': function (args) {
    file = '';
    if (args[0] === undefined) file = 'index';
    if (args[0] == '--listing') return 'cat - prints the contents of files (or current path index)';
    if (args[0] == '--help') return 'usage: cat &lt;file&gt;<br><br>\
      Prints the contents of files. Default: ./index<br>\
      Automatically executed when you change directory.';
    if (file != 'index') file = args[0];
    try_cat(file, false, hist_id);
    return ('<span id="history_' + (hist_id++) + '"></span><br>');
  },
  'cd': function (args) {
    if (args[0] === undefined || args[0] == '/') {
      try_cat('', true, hist_id);
    } else if (args[0] == '--listing') {
      return 'cd - change directory (hyperlink)';
    } else if (args[0] == '--help') {
      return 'usage: cd [path]<br><br>\
        Change directory and automatically `cat` content of README at that location. Default: `/`<br>';
    } else if (args[0] == '-') {
      try_cat(env['OLDPWD'], true, hist_id);
    } else if (args[0].match(/^\//)) {
      try_cat(args[0], true, hist_id);
    } else {
      try_cat(env['PWD']+(env['PWD'].match(/\/$/)?'':'/')+args[0], true, hist_id);
    }
    return ('<span id="history_' + (hist_id++) + '"></span><br>');
  },
  'clear': function (args) {
    if (args[0] != undefined && args[0] == '--listing') return 'clear - clears the terminal scrollback buffer';
    if (args[0] != undefined && args[0] == '--help') return 'usage: clear<br><br>Clears the terminal scrollback buffer.<br>';
    text = '';
    scrollback.innerHTML = '';
    return '';
  },
  'darkmode': function (args) {
    if (args[0] === undefined || args[0] == 'toggle') {
      if (dark_mode) {
        dark_mode = 0;
      } else {
        dark_mode = 1;
      }
    } else if (args[0] == 'on') {
      dark_mode = 1;
    } else if (args[0] == 'off') {
      dark_mode = 0;
    } else if (args[0] == '--listing') {
      return 'darkmode - toggle terminal dark mode';
    } else {
      return 'usage: darkmode [on|off|toggle]<br><br>\
        on     - Enable dark mode<br>\
        off    - Disable dark mode<br>\
        toggle - Invert current mode.<br>';
    }
    if (dark_mode) {
      document.body.style.setProperty('background', '#282828');
      document.body.style.setProperty('color', '#EBDBB2');
      document.body.style.setProperty('--background', '#282828');
      document.body.style.setProperty('--foreground', '#EBDBB2');
    } else {
      document.body.style.setProperty('background', '#EBDBB2');
      document.body.style.setProperty('color', '#282828');
      document.body.style.setProperty('--background', '#EBDBB2');
      document.body.style.setProperty('--foreground', '#282828');
    }
    return "Dark mode "+(dark_mode?'on':'off');
  },
  'echo': function (args) {
    if (args[0] != undefined && args[0] == '--listing') return 'echo - print input text to output';
    if (args[0] != undefined && args[0] == '--help') return 'usage: echo text<br><br>Print any text following command, with iterpolation of variables.<br>';
    text = '';
    args.forEach(function (a) {
      variables = a.match(/^\$(.*)/);
      if (variables != null) {
        if (env[variables[1]]) text += ' ' + env[variables[1]];
      } else if (a != '') {
        text += ' ' + a;
      }
    });
    if (text == '') return '<br>';
    return text + '<br>';
  },
  'env': function (args) {
    if (args[0] != undefined && args[0] == '--listing') return 'env - print pseudo-environment variables';
    if (args[0] != undefined && args[0] == '--help') return 'usage: env<br><br>\
        Prints the list of currently configured pseudo environment variables. Does not locate and execute commands like POSIX `env`<br>';
    text = '';
    Object.keys(env).forEach(function (a) {
      text += a + "=" + env[a] + "<br>";
    });
    return text;
  },
  'exit': function (args) {
    if (args[0] === undefined) {
      if (env['SUDO_USER'] === undefined) {
        history = [];
        env = {
          'PWD': '/',
          'USER': 'guest',
          'HOME': '/',
          'TERM': window.navigator.userAgent.replace(/[^\s]+\s(?:\([^\)]+\)\s)?[^\s]+\s(?:\([^\)]+\)\s)?([^\/]*).*/, '$1'),
          'HOSTNAME': 'mer.tz',
          'SHELL': 'fakeshell'
        };
        scrollback.innerHTML='';
        input.innerHTML='';
        currentPS1.innerHTML = '<span id="PS1USER">' + env['USER'] + '</span>' + basePS1 + '<span id="PS1COLON">:</span><span id="PS1PATH">' + env['PWD'] + '</span><span id="PS1PROMPT">$</span> ';
        return undefined;
      } else {
      env['USER'] = env['SUDO_USER'];
      delete env['SUDO_USER'];
      return undefined;
      }
    } else if (args[0] == '--listing') {
      return 'exit - log out from current session';
    } else {
    return 'usage: exit<br><br>\
        Log out from current session. As \'su\' will return to \'guest\'. Otherwise, starts a new session.';
    }
  },
  'help': function (args) {
    if (args[0] === undefined) {
      text = '';
      ordered.forEach(function (a) {
        console.log("Running "+a);
        let line = commands[a](['--listing']);
        console.log(line);
        if (line != undefined) text += line+"<br>";
      });
      return text;
    }
    if (args[0] == '--listing') return 'help - return list of available commands';
    return 'usage: env<br><br>\
      Prints the list of currently configured pseudo environment variables. Does not locate and execute commands like POSIX\
      `env`<br>';
  },
  'history': function (args) {
    if (args[0] != undefined && args[0] == '--listing') {
      return 'history - print command history';
    }
    if (args[0] != undefined && args[0] == '--help') {
      return 'usage: history<br><br>\
        Prints the history of commands that have been run.<br>';
    }
    let text = '';
    history.forEach(function (a) {
      text += a+'<br>';
    });
    return text;
  },
  'hostname': function (args) {
    if (args[0] != undefined && args[0] == '--listing') {
      return 'hostname - print the system hostname';
    }
    if (args[0] != undefined && args[0] == '--help') {
      return 'usage: hostname<br><br>\
        Prints the system hostname.<br>';
    }
    return env['HOSTNAME'];
  },
  'ls': function (args) {
    if (args[0] === undefined) return ls;
    if (args[0] == '--listing') return 'ls - list items in current directory';
    if ( args[0] == '-al' || args[0] == '-la' ) return lsal;
    if ( args[0] == '-a' ) return lsa;
    if ( args[0] == '-l' ) return lsl;
    return 'usage: ls [-al]<br><br>\
      Prints the list of files and directories contained within the current directory<br>\
      <br>\
      a - list hidden files also<br>\
      l - long listings<br>';
  },
  'pwd': function (args) {
    if (args[0] != undefined && args[0] == '--listing') {
      return 'pwd - print present working directory';
    }
    if (args[0] != undefined && args[0] == '--help') {
      return 'usage: pwd<br><br>\
        Prints the present working directory.<br>';
    }
    return env['PWD'];
  },
  'sudo': function (args) {
    if (args[0] === undefined) return "Usage: sudo [command]<br>";
    cmd = args.shift();
    if (cmd == '--listing') return 'sudo - pseudo sudo';
    if (cmd == '--help') return 'usage: sudo [command]<br><br>\
      Pretends to run a command using sudo permissions. Doesn\'t actuall do anything except superficially change the\
      ENV[\'USER\'].<br>';
    newuser = 'root';
    if (cmd == 'su') {
      if (env['SUDO_USER'] != undefined) return 'Command is not smart enough to actually track nested `su` shells. Enjoy your single level of fake `su` logins.<br>';
      if (args[1] != undefined) newuser = args[1];
      env['SUDO_USER'] = env['USER'];
      env['USER'] = newuser;
      //user.style.setProperty('color', "var('--red')");
      return '';
    }
    env['SUDO_USER'] = env['USER'];
    env['USER'] = newuser;
    runcmd(args);
    env['USER'] = env['SUDO_USER'];
    delete env['SUDO_USER'];
  },
  'test': function (args) {
    if (args[0] === undefined || args[0] == '--help') return 'usage: test<br><br>\
        Placeholder text<br>';
    if (args[0] == '--listing') return undefined; // Hidden function
    return "Hurray! You tested with: " + cmd;
  },
  'whoami': function (args) {
    if (args[0] != undefined && args[0] == '--listing') {
      return 'whoami - print the current username';
    }
    if (args[0] != undefined && args[0] == '--help') {
      return 'usage: whoami<br><br>\
        Prints the current username.<br>';
    }
    return env['USER'];
  }
};

let ordered = Object.keys(commands).toSorted();

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  dark_mode = 1;
  document.body.style.setProperty('background', '#282828');
  document.body.style.setProperty('color', '#EBDBB2');
  document.body.style.setProperty('--background', '#282828');
  document.body.style.setProperty('--foreground', '#EBDBB2');
}
input = document.getElementById("input");
scrollback = document.getElementById("scrollback");
prompt = document.getElementById("prompt");
currentPS1 = document.getElementById("PS1");
user = document.getElementById("PS1USER");
basePS1 = '<span id="PS1AT">@</span><span id="PS1HOST">' + env['HOSTNAME'] + "</span>";
currentPS1.innerHTML = '<span id="PS1USER">' + env['USER'] + '</span>' + basePS1 + '<span id="PS1COLON">:</span><span id="PS1PATH">' + env['PWD'] + '</span><span id="PS1PROMPT">$</span> ';

window.onload = async function () {
  blink(1);
  path = window.location.pathname;
  cmd = '';
  await loadFile(path+'.md', function (html) {
    if (html) {
      cmd = 'cat ' + path;
      input.innerHTML = cmd;
    } else {
      cmd = 'cd ' + path;
      input.innerHTML = cmd;
    }
    runcmd(cmd);
    env['PWD'] = path;
    if (window.location.hash) {
      cmd = window.location.hash;
      cmd = cmd.replace(/^#/, '');
      cmd = decodeURIComponent(cmd)
      input.innerHTML = cmd;
      runcmd(cmd);
    }
  });
};

grabber = document.getElementById("tabgrabber");
grabber.onfocus = async function () {
  range = document.createRange();
  selection = window.getSelection();
  selection.removeAllRanges();
  range.selectNodeContents(input);
  range.collapse(false);
  selection.addRange(range);
  input.focus();
};

async function runcmd(cmd) {
  if (back.length) {
    history.push(back);
    back = [];
  }
  let text = '';
  cmd = cmd.replace(/^(\s|&nbsp;)*/, '');
  if (cmd != undefined) {
    history.push(cmd);
    words = cmd.split(/\s+/);
    env['_'] = cmd
    first = env['_'].match(/([\w]+)=(.*)/);
    if (first) {
      env[first[1]] = first[2];
      text = undefined;
    } else if (words != undefined) {
      let cmd = words.shift();
      cmd = cmd.replace(/(\s|&nbsp;)*$/, '');
      if (commands[cmd] == null) {
        text = env['SHELL'] + ": " + cmd + ": command not found<br>";
      } else {
        console.log("Executing command: " + cmd + " with args: " + words);
        text = commands[cmd](words);
      }
    }
  }
  let buffer = input.innerHTML;
  input.innerHTML = '';
  if (text != undefined) {
    scrollback.innerHTML += '<span class="oldPS1">' + currentPS1.innerHTML + '</span><span class="oldCMD">' + buffer + "</span><br>";
    if (!text.match(/<br>$/)) text += '<br>';
    scrollback.innerHTML += text;
    prompt.style.display = 'none';
    currentPS1.innerHTML = '<span id="PS1USER">' + env['USER'] + '</span>' + basePS1 + '<span id="PS1COLON">:</span><span id="PS1PATH">' + env['PWD'] + '</span><span id="PS1PROMPT">$</span> ';
  }
  // Very brief delay is required, otherwise <br> will be appended to input.innerHTML
  await new Promise(r => setTimeout(r, 100));
  input.innerHTML = '';
  prompt.style.display = 'block';
  await new Promise(r => setTimeout(r, 100));
  prompt.scrollIntoView();
}

async function tabcomplete() {
  words = input.innerHTML.match(/([\w\-]+)/g);
  c = words.shift();
  found = [];
  console.log("starting " + c);
  if (words[0] == undefined) {
    console.log("no more words");
    if (commands[c] != undefined) {
      console.log("command exists: " + c);
      input.innerHTML += ' ';
      return;
    } else {
      ordered.forEach(function (b) {
        if (b.startsWith(c)) {
          found.push(b);
        }
      });
    }
  }
  if (found.length == 1) {
    input.innerHTML = found[0] + ' ';
  } else if (found.length) {
    text = found.join(' ');
    scrollback.innerHTML += '<span class="oldPS1">' + currentPS1.innerHTML + '</span><span class="oldCMD">' +
    input.innerHTML + "</span><br>";
    prompt.style.display = 'none';
    currentPS1.innerHTML = '<span id="PS1USER">' + env['USER'] + '</span>' + basePS1 + ":" + env['PWD'] + "# ";
    scrollback.innerHTML += text + "<br>";
    // Very brief delay is required, otherwise <br> will be appended to input.innerHTML
    await new Promise(r => setTimeout(r, 100));
    prompt.style.display = 'block';
  }
    input.focus();
  }

input.onkeydown = function (e) {
  if (e.keyCode == 13) {
    cmd = input.innerHTML.replace(/(<br>)+$/, '');
    cmd = cmd.replace(/\s+$/, ' ');
    runcmd(cmd);
  } else if (e.keyCode == 9) {
    tabcomplete();
  } else if (e.keyCode == 38) {
    previous = history.pop();
    if (previous != undefined) {
      input.innerHTML = previous;
      back.unshift(input.innerHTML);
    }
  } else if (e.keyCode == 40) {
    next = back.shift();
    if (next != undefined) {
      input.innerHTML = next;
      history.push(input.innerHTML);
    } else {
      input.innerHTML = '';
    }
  }
};

window.onkeydown = function (e) {
  if (input.isSameNode(document.activeElement) == false) {
    if (e.keyCode == 13) {
      runcmd();
      input.innerHTML = '';
    }
    input.focus();
  }
};
