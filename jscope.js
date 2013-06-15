/*!
 * jsDaST Framework v0.2.1
 * http://github.com/rgubarenko/jsdast
 * Client application framework based on jsRazor rendering engine.
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

    findScopes: function (scopeID)
    {
      var arr = [], nl;
      // select nodes (use query selector if available)
      if (_util.isFunc(document.querySelectorAll)) nl = document.querySelectorAll("[jsdast\\:scope]");
      else nl = document.getElementsByTagName("*");
      // filter nodes and put them into array
      for (var i = 0, n; n = nl[i]; ++i)
      {
        var a = n.getAttribute("jsdast:scope");
        if (a && (a == scopeID || a.indexOf(scopeID + "#") == 0)) arr.push(n);
      }

      return arr;
    },

    objLen: function(json)
    {
      var count = 0;
      for (var key in json) if (json.hasOwnProperty(key)) count++;
      return count;
    },

    extend: function (target, source)
    {
      for (var key in source) if (source.hasOwnProperty(key)) target[key] = source[key];
      return target;
    },

    isFunc: function (func) { return (typeof (func) == "function"); },
    isStr: function (str) { return (typeof (str) == "string"); },
    isValueType: function (obj) { return typeof (obj) == "string" || typeof (obj) == "number" || typeof (obj) == "boolean"; }
  };

  jQuery.findScopes = _util.findScopes;

  var _uid =
  {
    count: 1,
    next: function () { return this.count++; }
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
        var lim1 = this.settings.limiterFormat.replace("{type}", "repeatfrom").replace("{name}", name);
        var lim2 = this.settings.limiterFormat.replace("{type}", "repeatstop").replace("{name}", name);

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
        throw "[jsrazor] repeat() error: " + ex;
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
        var lim1 = this.settings.limiterFormat.replace("{type}", "showfrom").replace("{name}", name);
        var lim2 = this.settings.limiterFormat.replace("{type}", "showstop").replace("{name}", name);

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
        throw "[jsrazor] toggle() error: " + ex;
      }
    },

    newScopeRazor: function(tmp, data, elem)
    {
      return {
        uid: _uid.next(),
        tmp: tmp,
        data: data,
        elem: elem,
        repeat: function(name, items, render)
        {
          var thisObj = this;
          this.tmp = _razor.repeat(this.tmp, name, items, function(tmp, idx, item)
          {
            var scope = _razor.newScopeRazor(tmp, thisObj.data); // keep original data, but take new template for current item only
            if (_util.isFunc(render)) render(scope, idx, item);
            scope.tmp = _util.replaceAll(scope.tmp, "{{#" + name + "}}", scope.uid);
            return scope.tmp;
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
          getCtx: function(uid)
          {
            if (typeof (this.ctxs[uid]) == "undefined")
            {
              this.ctxs[uid] = { data: {}, tmp: null };
            }
            return this.ctxs[uid];
          },
          getFirstCtx: function()
          {
            for (var uid in this.ctxs)
            {
              if (this.ctxs.hasOwnProperty(uid)) return this.ctxs[uid];
            }
            return this.getCtx(_uid.next());
          },
          extendData: function(uid, data)
          {
            if (this.ctxs.hasOwnProperty(uid)) _util.extend(this.getCtx(uid).data, data);
          }
        };
      }
      return this.repos[scopeID];
    }
  };

  var jsdast = function (scopeID, uid)
  {
    if (typeof (scopeID) != "string" || !scopeID.match(/^[A-Za-z0-9_\-]+$/ig)) throw "[jsdast] scopeID param is invalid";
    if (uid && typeof (uid) != "number") throw "[jsdast] uid param is invalid";

    // select elements
    var elems = _util.findScopes(scopeID);

    return {
      _scopeID: scopeID,
      _uid: uid,
      _elems: elems,
      _repo: _repos.getRepo(scopeID),

      renderSetup: function (onRender, afterRender)
      {
        if (!_util.isFunc(onRender)) throw "[jsdast] invalid onRender callback";
        this._repo.onRender = onRender;
        // set optionsl afterRender callback
        if (afterRender)
        {
          if (!_util.isFunc(afterRender)) throw "[jsdast] invalid afterRender callback";
          this._repo.afterRender = afterRender;
        }
        // return scope for chaning
        return this;
      },

      data: function (data)
      {
        if (this._uid) this._repo.getCtx(this._uid);
        else if (this._repo.isEmpty()) this._repo.getCtx(_uid.next());

        // update datas if new data passed
        if (typeof (data) != "undefined")
        {
          for (var uid in this._repo.ctxs)
          {
            if (!this._uid || this._uid == uid)
            {
              this._repo.extendData(uid, data);
            }
          }
          // return scope for chaning
          return this;
        }
          // otherwise, return appropriate data
        else
        {
          // if uid defined, return data for uid
          // otherwise, return first available data
          if (this._uid) return this._repo.getCtx(this._uid).data;
          else return this._repo.getFirstCtx().data;
        }
      },

      refresh: function (extraData)
      {
        if (this._elems.length == 0) throw "[jsdast] no scopes selected for refresh";
        else if (!this._repo.onRender) throw "[jsdast] onRender callback is not set";

        for (var i = 0; i < this._elems.length; i++)
        {
          var elem = this._elems[i];
          if (!elem.nodeType || elem.nodeType !== 1) throw "[jsdast] invalid scope element";

          // get uid from element
          var uid = null, attr = elem.getAttribute("jsdast:scope");
          if (attr.indexOf("#") >= 0) uid = parseInt(attr.substr(attr.indexOf("#") + 1));

          // skip to next if uid does not match
          if (this._uid && this._uid !== uid) continue;

          // get context
          var ctx = null;
          if (uid) ctx = this._repo.getCtx(uid);
          else ctx = this._repo.getFirstCtx();

          // save original template
          if (!ctx.tmp) ctx.tmp = elem.innerHTML;

          // create new scope razor facade
          var scope = _razor.newScopeRazor(ctx.tmp, ctx.data, elem);
          // invoke rendering callback
          this._repo.onRender.apply(ctx.data, [scope, extraData]);
          // set resulted html back
          elem.innerHTML = scope.tmp;

          // invoke extra afterRender callback if set
          if (this._repo.afterRender) this._repo.afterRender.apply(ctx.data, [scope, extraData]);
        }
      }
    };

  };

  // allow both window and jQuery usage
  window.jsdast = jsdast;
  if (_util.isFunc(jQuery)) jQuery.jsdast = jsdast;

})();
