# jsDaST (jsRazor+DaST)

jsDaST is a cutting edge JavaScript framework for creating templated client-side apps with unmatched simplicity and flexibility. This tool is a combination of [jsRazor rendering engine](http://www.makeitsoft.com/jsrazor/jsrazor-overview/ "jsRazor rendering engine") and [DaST (Data Scope Tree)](http://www.makeitsoft.com/aspnetdast/dast-overview/ "DaST (Data Scope Tree)") architectural pattern which makes it the fastest, simplest, and the most intuive client-side templating solution.

Why use jsDaST?
- Ridiculously simple, learned by entry level developer in 10 minutes
- Based on jsRazor (string-based processing only, no DOM, no JS compilation, no RegEx parsing)
- Complete markup WYSIWYG: every byte of rendered output is consistent with the template
- Full separation of HTML template and JavaScript controller code
- Fully customizable output, no limitation at all

## LINKS

- [Getting Started with jsDaST](http://www.makeitsoft.com/jscope/jscope-info/ "Getting Started with jsDaST")
- [jsDaST Demos LIVE!](http://www.makeitsoft.com/jscope/jscope-demos/ "jsDaST Demos LIVE!")

## Quick Usage

According to [DaST pattern](http://www.makeitsoft.com/aspnetdast/dast-overview/ "DaST pattern"), the page is viewed as a set of randomly nested scopes. Scope is a rectangle corresponding to some container element (DIV, SPAN, etc.) in HTML template. Each scope is rendered individually and can be refreshed at any time. In jsDaST, every scope has 2 things associated with it:
- Rendering Callback - the function that does all jsRazor repeat-n-toggle stuff
- Generic Data - optional JSON data object to store variables and functions

First, we need to define the scopes inside HTML page. The code below shows the typical single scope definition. Notice [jsRazor](http://www.makeitsoft.com/jsrazor/jsrazor-overview/ "jsRazor") repeat-n-toggle delimiters inside the scope. 

``` html
<div jsdast:scope="Scope1">
  some HTML
  <!--repeatfrom:name1-->
    HTML fragment to repeat 
    plus value placeholders {Value1}   
    <!--repeatfrom:name2-->
      nested HTML fragment to repeat 
      plus value placeholders {Value2}
    <!--repeatstop:name2-->
    more HTML
    <!--showfrom:name3-->
      HTML fragment to show or hide
    <!--showstop:name3-->
    more HTML here
  <!--repeatstop:name1-->
  more HTML here
</div>
```

Second, we need to define a JavaScript controller consisting of rendering callback and optional scope data. If you need any event handlers, define them as part of scope data and call them directly via scope selector. The code below shows the typical jsDaST controller skeleton:

``` javascript
// defing rendering callback 
jsdast("Scope1").renderSetup( 
  function (scope) // primary rendering callback
  { 
    // do all your repeat-n-toggle here using
    // scope.repeat(..) and scope.toggle(..)
    // access data using scope.data
  },  
  function (scope) // after-rendering callback (optional)
  { 
    // your UI adjustment code here (for example, re-bind jQuery events)
    // also, call rendering on inner scopes if needed
  }); 

// define scope data
jsdast("Scope1").data({
  helloText: "Hello World!", // store any variables
  sayHello: function() // store any functions
  { 
    alert(this.helloText); 
  }}); 

// initial scope render
jsdast("Scope1").refresh(); 
``` 

This is all you need to know about jsDaST! See [Getting Started with jsDaST](http://www.makeitsoft.com/jsdast/jsdast-info/ "Getting Started with jsDaST") for more info.

## License and Copyright

Copyright (c) 2013 Roman Gubarenko

The jsDaST library is licensed under the [MIT](MIT-LICENSE.txt "MIT License Link") license.

You are free to use the jsDaST in commercial projects as long as the copyright header is left intact.

## Authors

[Roman Gubarenko] (https://github.com/rgubarenko)

