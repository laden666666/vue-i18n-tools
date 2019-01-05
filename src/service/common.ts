// 标记的符号
export const markString: [string, string] = ['-||', '||-']
// 标记的符号
export const interpolationMark: [string, string] = ['%||', '||%']

/**
 * 提取js字符串的结构
 * @export
 * @class ExtractJSStringResult
 */
export type ExtractStringResult = {
    // 提取字符串后的
    result: string,
    // 提取后的标记
    markString: [string, string],
    // 字符串插值的标记
    interpolationMark: [string, string],
    // 提取的结果
    extractString: ExtractString[]
}

export type ExtractString = {
    // 显示的序号
    index: number,
    // 原始的字符串
    originalCode: string,
    // 替换后的字符串
    replaceCode: string,
    // 替换部分的字符串
    word: string,
    // 类型： 0 js 1 属性 2 内容
    type: number
}