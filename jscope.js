/*!
 * jScope Framework v0.3.5
 * http://github.com/rgubarenko/jscope
 * Simplest client-side templating based on jsRazor rendering and DaST pattern.
 *
 * Copyright © 2013 Roman Gubarenko (roman@makeitsoft.com)
 * Released under the MIT license
 */


; (function()
{
  var _util =
  {
    findFragments: function(text, lim1, lim2)
    {
      // collect list of matches starting with lim1 and ending with lim2
      var matches = new Array();
      var lastIdx = 0;
      while (lastIdx < text.length - 1)
      {
        var match = {};

        // index of starting lim1
        match.idx1 = text.indexOf(lim1, lastIdx);
        if (match.idx1 < 0) break;
        lastIdx = match.idx1 + lim1.length;

        // index of ending lim2
        match.idx2 = text.indexOf(lim2, lastIdx);
        if (match.idx2 < 0) break;

        // template between lim1 and lim2
        match.temp = text.substr(lastIdx, match.idx2 - lastIdx);
        lastIdx = match.idx2 + lim2.length;

        matches.push(match);
      }

      return matches;
    },

    replaceAll: function(str, search, replace)
    {
      var idx;
      while ((idx = str.indexOf(search)) >= 0)
      {
        str = str.substr(0, idx) + replace + str.substr(idx + search.length);
      }
      return str;
    },

    findScopeGroup: function(scopeID)
    {
      var arr = [], elems;
      // select nodes (use query selector if available)
      if (_util.isFunc(document.querySelectorAll)) elems = document.querySelectorAll("[jscope\\:scope]");
      else elems = document.getElementsByTagName("*");
      // filter nodes and put them into array
      for (var i = 0, elem; elem = elems[i]; ++i)
      {
        var attr = elem.getAttribute("jscope:scope");
        if (attr && (attr == scopeID || attr.indexOf(scopeID + "#") == 0))
        {
          // make sure it's a valid container
          if (!elem.nodeType || elem.nodeType !== 1) throw "[jscope] invalid scope container";

          // parse uid if it's there
          var uid = null;
          if (attr.indexOf("#") >= 0) uid = parseInt(attr.substr(attr.indexOf("#") + 1));

          arr.push({ elem: elem, attr: attr, uid: uid });
        }
      }

      return arr;
    },

    filterScopes: function(scopes, uid)
    {
      var fscopes = new Array();
      for (var i = 0, scope; scope = scopes[i]; ++i) if (scope.uid == uid) fscopes.push(scope);
      return fscopes;
    },

    objLen: function(json)
    {
      var count = 0;
      for (var key in json) if (json.hasOwnProperty(key)) count++;
      return count;
    },

    clone: function(obj)
    {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) { if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr]; }
      return copy;
    },

    extend: function(target, source)
    {
      for (var key in source) if (source.hasOwnProperty(key)) target[key] = source[key];
    },

    isFunc: function(func) { return (typeof (func) == "function"); },
    isStr: function(str) { return (typeof (str) == "string"); },
    isValueType: function(obj) { return typeof (obj) == "string" || typeof (obj) == "number" || typeof (obj) == "boolean"; }
  };

  var _uid =
  {
    count: 1,
    next: function() { return this.count++; }
  };

  var _razor =
  {
    // TODO: make settings global
    settings:
    {
      limiterFormat: "<!--{type}:{name}-->"
    },

    repeat: function(fragment, name, items, render)
    {
      try
      {
        // validate input params
        if (!_util.isStr(fragment)) throw "Invalid fragment";
        else if (!_util.isStr(name)) throw "Invalid name";
        else if (!(items instanceof Array)) throw "Invalid data items array";
        else if (render && !_util.isFunc(render)) throw "Invalid rendering callback";

        var output = fragment;

        // starting and ending fragment limiters
        var lim1 = this.settings.limiterFormat.replace("{type}", "repeat").replace("{name}", name);
        var lim2 = this.settings.limiterFormat.replace("{type}", "#repeat").replace("{name}", name);

        // get list of matches starting with lim1 and ending with lim2
        var matches = _util.findFragments(output, lim1, lim2);

        // render data to every place where match is found
        for (var i = matches.length - 1; i >= 0; i--)
        {
          var match = matches[i];

          // render output for current matched repeater
          var repeaterOutput = "";
          for (var itemIdx = 0; itemIdx < items.length; itemIdx++)
          {
            var item = items[itemIdx];

            // render template for current item
            var itemOutput = match.temp;

            // invoke render callback to render the template
            if (render)
            {
              itemOutput = render(itemOutput, itemIdx, item);
              if (!_util.isStr(itemOutput)) throw "Rendering callback must return string value";
            }

            // automatically render values for some known objects
            // for string and number, output the values to {item} placeholder
            if (_util.isValueType(item))
            {
              itemOutput = _util.replaceAll(itemOutput, "{{item}}", "" + item);
            }
            // for JSON object, output applicable properties to placeholders
            else if (item && item.constructor && item.constructor === {}.constructor)
            {
              // automatically render placeholders for all applicable item properties
              for (var key in item)
              {
                if (item.hasOwnProperty(key) && _util.isValueType(item[key]))
                {
                  itemOutput = _util.replaceAll(itemOutput, "{{" + key + "}}", "" + item[key]);
                }
              }
            }

            repeaterOutput += itemOutput;
          }

          // now replace content from lim1 to lim2 to with rendered repeater output
          output = output.substr(0, match.idx1) + repeaterOutput + output.substr(match.idx2 + lim2.length);
        }

        return output;
      }
      catch (ex)
      {
        throw "[jscope] repeat() error: " + ex;
      }
    },

    toggle: function(fragment, name, flag)
    {
      try
      {
        // validate input params
        if (!_util.isStr(fragment)) throw "Invalid fragment";
        else if (!_util.isStr(name)) throw "Invalid name";

        var output = fragment;

        // starting and ending comment tags surrounding toggling area
        var lim1 = this.settings.limiterFormat.replace("{type}", "toggle").replace("{name}", name);
        var lim2 = this.settings.limiterFormat.replace("{type}", "#toggle").replace("{name}", name);

        // get list of matches starting with lim1 and ending with lim2
        var matches = _util.findFragments(output, lim1, lim2);

        // render data to every place where match is found
        for (var i = matches.length - 1; i >= 0; i--)
        {
          var match = matches[i];

          // render output for current toggling area
          var toggleOutput = "";
          if (flag) toggleOutput = match.temp; // if visible, leave content without limiters
          else toggleOutput = ""; // otherwise, dont show content nor limiters

          // now replace content from lim1 to lim2 to with rendered toggle output
          output = output.substr(0, match.idx1) + toggleOutput + output.substr(match.idx2 + lim2.length);
        }

        return output;
      }
      catch (ex)
      {
        throw "[jscope] toggle() error: " + ex;
      }
    },

    newScopeFacade: function(tmp, uid, data, elem)
    {
      return {
        uid: uid,
        tmp: tmp,
        data: data,
        elem: elem,
        repeat: function(name, items, render)
        {
          var thisObj = this;
          this.tmp = _razor.repeat(this.tmp, name, items, function(tmp, idx, item)
          {
            var uid = _uid.next(); // generate new scope uid
            var facade = _razor.newScopeFacade(tmp, uid, thisObj.data, thisObj.elem); // keep original data, but take new template for current item only
            if (_util.isFunc(render)) render(facade, idx, item);
            facade.tmp = _util.replaceAll(facade.tmp, "{{#" + name + "}}", uid);
            return facade.tmp;
          });
        },
        toggle: function(name, flag)
        {
          this.tmp = _razor.toggle(this.tmp, name, flag);
        },
        value: function(placeholder, value)
        {
          this.tmp = _util.replaceAll(this.tmp, placeholder, "" + value);
        }
      };
    }
  };

  var _repos =
  {
    repos: {},
    getRepo: function(scopeID)
    {
      if (typeof (this.repos[scopeID]) == "undefined")
      {
        this.repos[scopeID] = {
          ctxs: {},
          onRender: null,
          afterRender: null,
          isEmpty: function() { return (_util.objLen(this.ctxs) == 0); },
          getCtx: function (uid)
          {
            if (!(uid in this.ctxs))
            {
              this.ctxs[uid] = { data: {}, tmp: null };
            }

            return this.ctxs[uid];
          }
        };
      }
      return this.repos[scopeID];
    }
  };

  var jscope = function(scopeID, uid)
  {
    if (typeof (scopeID) != "string" || !scopeID.match(/^[A-Za-z0-9_\-]+$/ig)) throw "[jscope] scopeID param is invalid";
    if (uid && typeof (uid) != "number") throw "[jscope] uid param is invalid";

    // select elements
    var scopes = _util.findScopeGroup(scopeID);

    return {
      _scopeID: scopeID,
      _uid: (uid ? uid : null),
      _scopes: scopes,
      _repo: _repos.getRepo(scopeID),

      setRender: function(onRender, afterRender)
      {
        if (!_util.isFunc(onRender)) throw "[jscope] invalid onRender callback";
        this._repo.onRender = onRender;
        // set optional afterRender callback
        if (afterRender)
        {
          if (!_util.isFunc(afterRender)) throw "[jscope] invalid afterRender callback";
          this._repo.afterRender = afterRender;
        }
        // return scope for chaning
        return this;
      },

      setData: function(data)
      {
        // ensure data is valid JSON object
        if (!data || !data.constructor || data.constructor !== {}.constructor) throw "[jscope] invalid JSON data object";

        // initialize context at current uid
        this._repo.getCtx(this._uid);

        // if data is global, extend all contexts
        if (this._uid === null)
        {
          for (var uid in this._repo.ctxs)
          {
            if (this._repo.ctxs.hasOwnProperty(uid)) _util.extend(this._repo.ctxs[uid].data, data);
          }
        }
        // otherwise, assing data to specific contexts merging NULL+ctxs[uid]+data
        else
        {
          var newData = {};
          if (null in this._repo.ctxs) _util.extend(newData, this._repo.ctxs[null].data);
          _util.extend(newData, this._repo.ctxs[this._uid].data);
          _util.extend(newData, data);
          this._repo.ctxs[this._uid].data = newData;
        }
      },

      refresh: function(extraData)
      {
        if (!this._repo.onRender) throw "[jscope] onRender callback is not set";

        var scopes = this._scopes;
        if (this._uid) scopes = _util.filterScopes(scopes, this._uid);
        if (scopes.length == 0) throw "[jscope] no scopes selected for refresh";

        for (var i = 0, scope; scope = scopes[i]; ++i)
        {
          // get context for current scope
          var ctx = this._repo.getCtx(scope.uid);

          // save original template
          if (!ctx.tmp) ctx.tmp = scope.elem.innerHTML;

          // create new scope razor facade
          var facade = _razor.newScopeFacade(ctx.tmp, scope.uid, ctx.data, scope.elem);
          // invoke rendering callback
          this._repo.onRender.apply(ctx.data, [facade, extraData]);
          // set resulted html back
          scope.elem.innerHTML = facade.tmp;

          // invoke extra afterRender callback if set
          if (this._repo.afterRender) this._repo.afterRender.apply(ctx.data, [facade, extraData]);
        }
      },

      data: function()
      {
        var data = this._repo.getCtx(this._uid).data;

        var scopes = _util.filterScopes(this._scopes, this._uid);
        if (scopes.length == 0) data._scope = scopes[0];

        return data;
      }
    };

  };

  // allow window usage
  window.jscope = jscope;

})();