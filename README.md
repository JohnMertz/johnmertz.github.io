# mer.tz

This is the source code for my fake TUI website experiment.

The following is needed in the Nginx site configuration `server` block:

```
    # Default page is index.html
    index index.html;


    # Any URI with an extension should be fetched normally from the GitHub proxy.
    location ~ \. {
        proxy_pass https://johnmertz.github.io/$request_uri;
    }

    # Any URI without an extension should be redirected to the index
    # `index.js` will use the `window.location.pathname`` to automatically `cd` to
    # the appropriate "directory". The `.hash` will immediately execute a command.
    location / {
        try_files /index.html =404;
        proxy_pass https://johnmertz.github.io/;
    }
```

The website only ever loads `index.html` and then additional content is fetched and loaded into the `scrollback` block of the body as commands are executed. The majority of the content is loaded from markdown files with the formatting being substituted for HTML. It is done this way because I have an intention to convert the site `john.me.tz` to read from the same files but render more like a normal website. I also want to be able to easily convert the markdown documents to XML for publishing an RSS feed.

Because it runs entirely client-side, there is no way for the user to get a proper directory listing, so instead the `index` entry for each directory, which is automatically printed upon changing directories, requires an initial block comment which contains the listings. Requests aren't limited to this, so it is possible to `cat` hidden files not listed by `ls`.

I threw this together very quickly when the stupid idea popped into my head. I don't recommend anyone else use this without heavy modifications. The biggest obvious issues is that it accepts arbitrary inputs without sufficient sanitization (I'm pretty sure, but I haven't bothered to check yet). It runs on the client side, so this could only realy be exploited with a malicious link, but still...

Additional commands and content to come.
