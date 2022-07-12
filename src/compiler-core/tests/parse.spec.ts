import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {

  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{ message }}");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });
  describe("simple element div", () => {
    it("simple ele", () => {
      const ast = baseParse("<div></div>");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: []
      });
    });
  });

  describe("text", () => {
    it("simple text", () => {
      const ast = baseParse("some text");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text"
      })
    })
  })

  /**
   * 解析三种联合类型 插值 ele text
   * <div> hi, {{message}} </div>
   */
  test('hello world', () => {
    const ast = baseParse("<div>hi,{{message}}</div>"); // 需要注意 <div> hi, 前后的空格可能导致测试不通过

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,"
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        }
      ]
    })
  });


});
