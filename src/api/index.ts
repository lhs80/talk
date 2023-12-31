import axios, {AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse} from "axios";
import {ElMessage} from "element-plus";
import {ResultData} from "@/api/interface";
import {checkStatus} from "./helper/checkStatus";
import {getToken, clearToken} from "@/utils/auth";

const config = {
  // 默认地址请求地址，可在 .env.** 文件中修改
  baseURL: import.meta.env.MODE === 'development' ? import.meta.env.VITE_SERVER_API : apiURL,
  // 设置超时时间
  timeout: timeout,//超时时间从配置文件中取得
  // 跨域时候允许携带凭证
  withCredentials: true,
  headers: {
    "internet": internet.toString()
  }
};

class RequestHttp {
  service: AxiosInstance;

  public constructor(config: AxiosRequestConfig) {
    // instantiation
    this.service = axios.create(config);

    /**
     * @description 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     */
    this.service.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (getToken() && getToken().token) {
          config.headers.set("token", getToken().token);
        }
        if (config.url.indexOf("dms") >= 0 || config.url.indexOf('materials/export') >= 0) {
          config.timeout = 300000;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    /**
     * @description 响应拦截器
     *  服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const {data} = response;
        // 登陆失效
        if (data.code == 113) {
          clearToken();
          window.location.href = '/';
          ElMessage.error(data.msg);
          return Promise.reject(data);
        }
        // 全局错误信息拦截（防止下载文件的时候返回数据流，没有 code 直接报错）
        if (data.code && data.code !== 200) {
          ElMessage.error(data.msg || data.message);
          return Promise.reject(data);
        }
        // 成功请求（在页面上除非特殊情况，否则不用处理失败逻辑）
        return data;
      },
      async (error: AxiosError) => {
        console.log("error",error);
        const {response} = error;
        // 请求超时 && 网络错误单独判断，没有 response
        if (error.message.indexOf("timeout") !== -1) {
          ElMessage.error("请求超时！请您稍后重试");
        }
        if (error.message.indexOf("Network Error") !== -1) {
          ElMessage.error("网络错误！请您稍后重试");
        }
        // 根据服务器响应的错误状态码，做不同的处理
        if (response) {
          console.log("response",response);
          checkStatus(response.data.code, response.data.message);
        }

        // 服务器结果都没有返回(可能服务器错误可能客户端断网)，断网处理:可以跳转到断网页面
        // if (!window.navigator.onLine) router.replace("/500");
        return response.data//Promise.reject(response);
      }
    );
  }

  /**
   * @description 常用请求方法封装
   */
  get<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.get(url, {params, ..._object});
  }

  post<T>(url: string, params?: object | string, _object = {}): Promise<ResultData<T>> {
    return this.service.post(url, params, _object);
  }

  put<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.put(url, params, _object);
  }

  delete<T>(url: string, params?: any, _object = {}): Promise<ResultData<T>> {
    return this.service.delete(url, {params, ..._object});
  }

  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.service.get(url, {params, ..._object, responseType: "blob"});
  }
}

export default new RequestHttp(config);
