/**
 * @name  AutoRegistryComponents
 * @description 按需加载，自动引入组件
 */

import Components from "unplugin-vue-components/vite";
import {ElementPlusResolver, VueUseComponentsResolver, VantResolver} from "unplugin-vue-components/resolvers";
import zhCn from "element-plus/lib/locale/lang/zh-cn";
import locale from 'element-plus/lib/locale/lang/zh-cn' //中文

export const AutoRegistryComponents = () => {
  return Components({
    dirs: ["src/components"],
    extensions: ["vue", "md"],
    deep: true,
    dts: "types/components.d.ts",
    directoryAsNamespace: false,
    globalNamespaces: [],
    directives: true,
    include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/],
    resolvers: [
      ElementPlusResolver({ locale }),
      VueUseComponentsResolver(),
      VantResolver(),
      (componentName) => {
        if (componentName === 'XHeader' || componentName === 'XNotice') {
          return {name: componentName, from: '@xsykj/base-ui'}
        }
        if (componentName==='XsyVideo') {
          return {name: componentName, from: '@xsykj/video'}
        }
      }
    ],
  });
};
