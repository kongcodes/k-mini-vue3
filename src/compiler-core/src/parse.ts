import { NodeTypes } from "./ast";

export function baseParse(content: string) {

  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];
  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}

function parseInterpolation(context) {
  // 解析 插值 {{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
  advanceBy(context, openDelimiter.length); // -> message}}
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();
  // console.log(context.source);
  // console.log(content);

  advanceBy(context, rawContentLength + closeDelimiter.length); // -> message

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  }
}

function createParserContext(content: string) {
  return {
    source: content,
  };
}

function createRoot(children) {
  return {
    children
  };
}

// util
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
