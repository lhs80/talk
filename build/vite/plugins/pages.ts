/**
 * @name ConfigPagesPlugin
 * @description 动态生成路由
 */
import Pages from "vite-plugin-pages";

export const ConfigPagesPlugin = () => {
  return Pages({
    pagesDir: [{dir: "src/views", baseRoute: "/"}],
    extensions: ["vue", "md"],
    exclude: ["**/components/*.vue"],
    nuxtStyle: true,
    extendRoute(route) {//遍历所有路由
      // console.log(route);
    }
  });
};
