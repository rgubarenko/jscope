# jsDaST (jsRazor+DaST)

jsDaST is a cutting edge JavaScript framework for creating templated client-side apps with unmatched simplicity and flexibility. This tool is a combination of [jsRazor rendering engine](http://www.makeitsoft.com/jsrazor/jsrazor-overview/ "jsRazor rendering engine") and [DaST (Data Scope Tree)](http://www.makeitsoft.com/aspnetdast/dast-overview/ "DaST (Data Scope Tree)") architectural pattern which makes it the fastest, simplest, and the most intuive client-side templating solution.

Why use jsDaST?
- Ridiculously simple, learned by entry level developer in 10 minutes
- Based on jsRazor (string-based processing only, no DOM, no JS compilation, no RegEx parsing)
- Complete markup WYSIWYG: every byte of rendered output is consistent with the template
- Full separation of HTML template and JavaScript controller code
- Fully customizable output, no limitation at all

## Usage

According to DaST pattern, the page is viewed as a set of randomly nested scopes. Scope is a rectangle corresponding to some container element (DIV, SPAN, etc.) in HTML template. Each scope is rendered individually and can be refreshed at any time.  

## License and Copyright

Copyright (c) 2013 Roman Gubarenko

The jsDaST library is licensed under the [MIT](MIT-LICENSE.txt "MIT License Link") license.

You are free to use the jsDaST in commercial projects as long as the copyright header is left intact.

## Authors

[Roman Gubarenko] (https://github.com/rgubarenko)

