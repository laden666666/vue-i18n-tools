/**
 * 提取js字符串的结构
 * @export
 * @class ExtractJSStringResult
 */
export interface ExtractJSStringResult{
    // 提取字符串后的
    result: string,
    // 提取后的标记
    markString: string,
    // 提取的结果
    extractString: string[]
}
