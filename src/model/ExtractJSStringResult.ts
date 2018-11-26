/**
 * 提取js字符串的结构
 * @export
 * @class ExtractJSStringResult
 */
export interface ExtractJSStringResult{
    // 提取字符串后的
    result: string,
    // 提取后的标记
    markString: [string, string],
    // 字符串插值的标记
    interpolationMark: [string, string],
    // 提取的结果
    extractString: string[]
}
