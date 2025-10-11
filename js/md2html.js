/* md2html.js - Mostly compliant markdown to HTML renderer
* Author: John Mertz <git@john.me.tz>
* License: GPLv3+
*
* This tool allows for simple static site generation without needing a generator. Just write your
* document in Markdown, create a skeleton webpage and import the Markdown document into that page.
* The tool currently has no sanity checks for pages that aren't Markdown, pages that are formatted
* incorrectly, pages that don't load or any other frills.
*
* Currently this does not support:
*
* - Footnotes (and footnote style images)
* - Emoticon -> emoji conversion
* - Typographic replacements (use unicode in the source document instead)
* - Definitions (dt/dd) blocks
* - Any plugins/extensions
*
* Could also use:
*
* - more robust classes, eg. for list numbers
* - quite a bit of re-factoring for speed and sanity
*
* Usage: Include library in your web document then run:
*
* loadMd("/path/to/document.md","idOfField");
*
* `/path/to/document.md` can be any href for the Markdown document you would like to render.
* `idOfField` is any id on your page where you'd like the formatted HTML to be rendered to.
*/

function textFormatting(input) {
  input = input.replace(/\[([^\]]*)\]\(([^\)]*\.(?:jpeg|png|svg|webp))\)/g, '<a class="markdown-a" onmouseover="img_hover(\'$2\')" onmouseout="restore_input()" href="javascript:img_link(\'$2\')">$1</a>');
  input = input.replace(/\[([^\]]*)\]\(([^\)]*)\.md\)/g, '<a class="markdown-a" onmouseover="cat_hover(\'$2\')" onmouseout="restore_input()" href="javascript:cat_link(\'$2\')">$1</a>');
  input = input.replace(/\[([^\]]*)\]\((https?:\/\/[^\)]*)\)/g, '<a class="markdown-a" onmouseover="open_hover(\'$2\')" onmouseout="restore_input()" href="javascript:open_link(\'$2\')">$1</a>');
  input = input.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, '<a class="markdown-a" onmouseover="cd_hover(\'$2\')" onmouseout="restore_input()" href="javascript:cd_link(\'$2\')">$1</a>');
  input = input.replace(/(?<!<[^>]*?)(?:\`([^\`]+)\`)/g, '<span class="markdown-inline">$1</span>');
  input = input.replace(/(?<!<[^>]*?)(?:!\[([^\]]*)\]\(([^\)]*)\))/g, '<div class="markdown-img-container"><img class="markdown-img" src="$2" alt="$1"/></div>');
  input = input.replace(/(?<!<[^>]*?)(?:\*\*([^\*]+)\*\*)/g, '<b class="markdown-bold">$1</b>');
  input = input.replace(/(?<!<[^>]*?)(?:__([^_]+)__)/g, '<b class="markdown-bold">$1</b>');
  input = input.replace(/(?<!<[^>]*?)(?:\*([^\*]+)\*)/g, '<em class="markdown-em">$1</em>');
  input = input.replace(/(?<!<[^>]*?)(?:_([^_]+)_)/g, '<em class="markdown-em">$1</em>');
  input = input.replace(/(?<!<[^>]*?)(?:\+\+([^\+]+)\+\+)/g, '<ins class="markdown-ins">$1</ins>');
  input = input.replace(/(?<!<[^>]*?)(?:\=\=([^\=]+)\=\=)/g, '<mark class="markdown-mark">$1</mark>');
  input = input.replace(/(?<!<[^>]*?)(?:\~\~([^\~]+)\~\~)/g, '<s class="markdown-strike">$1</s>');
  return input;
}

function quotes(input, state) {
  let newDepth = 0;
  if (input.match(/^> ?/g)) {
    newDepth = input.match(/(> ?)/g).length;
  }
  if (newDepth > state.quoteDepth) {
    if (input.match(/^>/)) {
      for (let i = 0; i+state.quoteDepth < newDepth; i++) {
        danglingNewline = 0;
        html += '<blockquote class="markdown-quote'+newDepth+'">';
      }
    }
  } else {
    for (let i = 0; state.quoteDepth-i > newDepth; i++) {
      danglingNewline = 0;
      html += '</blockquote>';
    }
  }
  state.quoteDepth = newDepth;
}

function lists(input, state, ordered) {
  let newDepth = 1;
  if (input.match(/^( )/g)) {
    newDepth = (input.match(/^\s*/)[0].length/2) + 1;
  }
  if (newDepth > state.listTypes.length) {
    for (let i = state.listTypes.length; i < newDepth; i++) {
      danglingNewline = 0;
      if (ordered) {
        start = input.match(/^\s*(\d+)\./)[1];
        html += '<ol '+(start === null ? '' : 'start="'+start+'"')+' class="markdown-ol markdown-ol-'+i+'">';
        state.listTypes.push(1);
      } else {
        html += '<ul class="markdown-ul markdown-ul-'+i+'">';
        state.listTypes.push(0);
      }
    }
  }
  if (state.listTypes.length > newDepth) {
    collapseLists(state, newDepth);
  }
}

function collapseLists(state, newDepth) {
  danglingNewline = 0;
  while (state.listTypes.length > newDepth) {
    if (state.listTypes[state.listTypes.length-1]){
      html += '</ol><br>';
    } else {
      html += '</ul><br>';
    }
    state.listTypes.pop();
  }
}

function cleanup() {
  if (state.danglingList) {
    html += '</li>';
    state.danglingList = 0;
  }
  if (state.inP) {
    html += '</p><br>';
    state.inP = 0;
  }
  if (state.inTable) {
    state.inTable = 0;
    html += "</tr></table>";
  }
  return;
}

function tables (input, state) {
  collapseLists(state, 0);
  if (!state.inTable) {
    state.inTable = 1;
    state.tableJustification = [];
    html += '<table class="markdown-table">';
    html += '<tr class="markdown-tr markdown-tr-heading">';
    state.tableHeadings = input;
  } else if (input.match(/^\|\s*:?\-+:?\s*\|/)) {
    matches = input.match(/\|([^\|]+)/g);
    if (matches === null) {
      return;
    }
    matches.forEach( b => {
      b = b.replace(/^\|\s*(.*[^\s]).*/, '$1');
      if (b.match(/^:\-+:/)) {
        state.tableJustification.push('center');
      } else if (b.match(/^\-+:/)) {
        state.tableJustification.push('right');
      } else {
        state.tableJustification.push('left');
      }
    });
    matches = state.tableHeadings.match(/\|([^\|]+)/g);
    column = 0;
    matches.forEach( b => {
      b = b.replace(/^\|\s*(.*[^\s])\s*/, '$1');
      html += '<th class="markdown-th"'+(state.tableJustification[column] == 'left' ? '' : ' style="text-align: '+state.tableJustification[column]+';"')+'>'+b+'</th>';
    });
    delete(state.tableHeadings);
  } else {
    html += '</tr><tr class="markdown-tr">';
    matches = input.match(/\|([^\|]+)/g);
    if (! state.tableJustification.length) {
      /*matches.foreach( b => {
        state.tableJustification.push('left');
      });
      */
    }
    column = 0;
    matches.forEach( b => {
      b = b.replace(/^\|\s*(.*[^\s])\s*/, '$1');
      html += '<td class="markdown-td"'+(state.tableJustification[column] == 'left' ? '' : ' style="text-align: '+state.tableJustification[column]+';"')+'>'+b+'</td>';
      column++;
    });
  }
  return;
}

function md2html(md, index) {
  lines = md.split("\n");
  html = '';
  metadata = {};
  if (index) {
    metadata.ls = {};
  }
  var abbreviations = {};
  state = {
    inCode: 0,
    inQuote: 0,
    inTable: 0,
    quoteDepth: 0,
    listTypes: [],
    inP: 0,
    inLi: 0,
    danglingNewline: 0,
    danglingList: 0,
    inComment: 0
  }
  lines.forEach( a => {
    //* Comment block *//
    // Only full-line comments are ignored
    // Initial comment is a special case.
    if (!state.inComment && a.match(/^<!--/)) {
      if (! a.match(/-->$/)) {
        state.inComment = 1;
      }
      return;
    }
    //* Code blocks *//
    // Highest priority to code blocks because all other formatting is ignored.
    // Simplest code blocks have every line indented by 4 or more
    if (!state.inCode && a.match(/^    (?![\-\+\*])/)) {
      html += '<code class="markdown-code">';
      state.inCode = 1;
    }
    // The other code block format is delimited by````
    if (a.match(/^\`\`\`/)) {
      if (state.inCode == 2) {
        state.inCode = 0;
        html += '</code>';
        return;
      } else {
        // The language of the code block can optionally be provided
        if (a.match(/^\`\`\` ?(.+)$/)) {
          // We simply add a heading to the block. Code highlighting is way outside the scope
          a = a.replace(/^\`\`\` ?(.+)?$/, '<span class="markdown-code-language">$1</span><code class="markdown-code markdown-code-$1">');
        } else {
          a = a.replace(/^\`\`\`/, '<code class="markdown-code">');
        }
        html += a;
        state.inCode = 2;
        return;
      }
    // Custom containers function similarly to code blocks except that additional formatting is applied
    } else if (a.match(/^:::/)) {
      if (state.inCode == 3) {
        state.inCode = 0;
        html += '</div>';
        return;
      } else {
        if (a.match(/^::: ?(.+)$/)) {
          a = a.replace(/^::: ?(.+)?$/, '<div class="markdown-container markdown-container-$1">');
        }
        html += a;
        state.inCode = 3;
        return;
      }
    }
    // Ignore contents of comments.
    if (state.inComment == 1) {
      if (a.match(/-->$/)) {
        state.inComment = 0;
        if (!html) {
          html += '<br>';
        }
        return;
      }
      // Comments at the start of the article are a special case to contain metadata
      if (html == '') {
        if (index) {
          matches = a.match(/^([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(.*)\s+([^\s]+)/);
          metadata.ls[matches[7]] = { perm: matches[1], links: matches[2], user: matches[3], group: matches[4], size: matches[5], modified: matches[6] };
        }
      }
      return;
    }
    // Empty newlines or any other line with 4 leading spaces continue the code block
    if (state.inCode == 1) {
      if (! a.match(/^    /)) {
        html += '</code>';
        state.inCode = 0;
      } else {
        a = a.replace(/^    /, '');
      }
    } else if (state.inCode == 2) {
        a = a.replace(/ /, '&nbsp;');
    }
    // If still in code by now, append to output and don't process anything else.
    if (state.inCode && state.inCode < 3) {
      html += a+'<br/>';
      return;
    }
    // Immediate return for lines without other possible formatting
    if (a.match(/^(\*\*\*+|\-\-\-+|___+)$/)) {
      // Close ul's and p's if open, don't close quotes
      cleanup(state);
      html += '<hr class="markdown-hr"/>';
      return;
    } else if (a.match(/^\*\[[^\]]+\]: /)) {
      matches = a.match(/^\*\[([^\]]+)\]: (.*)/);
      abbreviations[matches[1]] = matches[2];
      return;
    }
    // Quotes
    quotes(a, state);
    if (state.quoteDepth) {
      a = a.replace(/^(> ?)* /, '');
    }
    // Format text before worrying about tags
    a = textFormatting(a);
    //* Single-line tags *//
    // Blank lines will discontinue multi-line tags
    if (a.match(/^\s*$/)) {
      if (state.inP) {
        html += '</p><br>';
        state.inP = 0;
      }
      if (state.danglingList) {
        html += '</li>';
        state.inLi = 0;
        state.danglingList = 0;
        collapseLists(state, 0);
      }
      return;
    }
    if (a.match(/^#/)) {
      state.danglingNewline=0;
      cleanup(state);
      if (a.match(/^######/)) {
        a = a.replace(/^######(.*)/, '<h6 class="markdown-h6">$1</h6><br>');
      } else if (a.match(/^#####/)) {
        a = a.replace(/^#####(.*)/, '<h5 class="markdown-h5">$1</h5><br>');
      } else if (a.match(/^####/)) {
        a = a.replace(/^####(.*)/, '<h4 class="markdown-h4">$1</h4><br>');
      } else if (a.match(/^###/)) {
        a = a.replace(/^###(.*)/, '<h3 class="markdown-h3">$1</h3><br>');
      } else if (a.match(/^##(.*)/)) {
        a = a.replace(/^##(.*)/, '<h2 class="markdown-h2">$1</h2><br>');
      } else if (a.match(/^#(.*)/)) {
        a = a.replace(/^#(.*)/, '<h1 class="markdown-h1">$1</h1><br>');
      }
      html += a;
      return;
    }
    // Lists
    if (state.danglingList && !a.match(/^\s*[\-\+\*] /) && !a.match(/^\s*\d+\. /)) {
      html += a;
      return;
    }
    if (a.match(/^\s*[\-\+\*] /)) {
      lists(a, state, 0);
      a = a.replace(/^\s*[\-\+\*] /, '');
      state.danglingList = 1;
      html += '<li class="markdown-ul-li">'+a;
      return;
    }
    if (a.match(/^\s*\d+\. /)) {
      lists(a, state, 1);
      a = a.replace(/^\s*\d+\. /, '');
      state.danglingList = 1;
      html += '<li class="markdown-ol-li">'+a;
      return;
    }
    // Tables
    if (a.match(/^\|[^\|]+\|/)) {
      tables(a, state);
      return;
    } else {
      if (state.inTable) {
        state.inTable = 0;
        html += "</tr></table>";
      }
    }
    if ((state.inP + state.inTable + state.inLi + state.inCode + state.inQuote + state.danglingList) == 0) {
      collapseLists(state, 0);
      state.inP=1;
      html += "<p>";
    } else if (state.danglingList) {
      state.danglingList++;
    }
    html += ' '+a;
  });

  // Make all abbreviation replacements at the end
  Object.keys(abbreviations).forEach(function (key) {
    regex = new RegExp("([^a-z])"+key+"([^a-z])", "g");
    html = html.replaceAll(regex, '$1<abbr title="'+abbreviations[key]+'">'+key+'</abbr>$2');
  })
  cleanup();
  html = html.replace(/<br>\s*$/, '');
  return { cat_text: html, meta: metadata };
}
