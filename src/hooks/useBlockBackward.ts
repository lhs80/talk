export const useBlockBackward = () => {
  //阻止浏览器回退按钮
  if (window.history && window.history.pushState) {
    window.history.replaceState(null, null, document.URL);
    window.addEventListener("popstate", () => {
        window.history.replaceState(null, null, document.URL);
      },
      false
    );
  }
};