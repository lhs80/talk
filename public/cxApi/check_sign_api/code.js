(function (window, undefined) {
  window.oncontextmenu = function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    return false;
  };

  var _userAgent = navigator.userAgent.toLowerCase();
  var _userAgentIE = (_userAgent.indexOf("msie") > -1 || _userAgent.indexOf("trident") > -1) && _userAgent.indexOf("edge") < 0;

  window.isInit = false;

  window.Asc.plugin.init = function (text) {
    if (!window.isInit) {
      window.isInit = true;
      this.callCommand(function () {
        var oDocument = Api.GetDocument();
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText(" ");
        oDocument.Push([oParagraph]);
        let parentData = { type: "checkSign" };
        window.parent.postMessage(window.JSON.stringify(parentData), "*");
      }, true);
    }
  };

  window.addEventListener("message", function (e) {});

  window.Asc.plugin.event_onTargetPositionChanged = function () {};

  window.Asc.plugin.onMethodReturn = function (returnValue) {};
  window.Asc.plugin.onExternalPluginMessage = function () {};
  window.Asc.plugin.onTargetPositionChanged = function () {};

  window.Asc.plugin.onExternalMouseUp = function () {
    if (!_userAgentIE) {
      var event = new MouseEvent("mouseup", {
        view: window,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);
    } else {
      var mouseUpEvent = document.createEvent("MouseEvents");
      mouseUpEvent.initEvent("mouseup", true, true);
      document.dispatchEvent(mouseUpEvent);

      document.dispatchEvent(mouseUpEvent);
    }
  };

  window.Asc.plugin.onMethodReturn = function (returnValue) {
    if (window.Asc.plugin.info.methodName == "InsertAndReplaceContentControls") {
      window.Asc.plugin.executeMethod("GetAllContentControls");
    }
    console.log(JSON.stringify(returnValue));
  };

  //关闭扩展触发事件
  window.Asc.plugin.button = function (id) {
    this.executeCommand("close", "");
  };
})(window, undefined);
