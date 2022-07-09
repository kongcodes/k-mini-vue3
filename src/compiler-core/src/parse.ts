import { NodeTypes, TagTypes } from "./ast";

export function baseParse(content: string) {

  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];
  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }

  // 解析 Text
  if(!node){
    node = parseText(context);
  }

  nodes.push(node);
  return nodes;
}

function parseText(context: any){
  const content = parseTextData(context, context.source.length);

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseElement(context: any) {
  const element = parseTag(context, TagTypes.START);
  parseTag(context, TagTypes.END);
  // console.log("-------", context.source);
  return element;
}

function parseTag(context: any, type: TagTypes) {
  // 1.解析 tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source); //<d 或者 </d 开头，因为要两次处理，第一次是开始标签第二次是结束标签
  const tag = match[1]; // -> div

  // 2.删除处理过的内容
  advanceBy(context, match[0].length);
  // console.log(context.source); // "></div>"
  advanceBy(context, 1); // "</div>"

  // 处理结束标签时不需要返回值
  if (type === TagTypes.END) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context) {
  // 解析 插值 {{message}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
  advanceBy(context, openDelimiter.length); // -> message}}
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  // console.log(context.source);
  // console.log(content);

  advanceBy(context, closeDelimiter.length); // -> message

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
function parseTextData(context: any, length) {
  // 1. 获取content
  const content = context.source.slice(0, length);
  // 2. 推进
  advanceBy(context, length);
  // console.log(context.source); // 空
  return content;
}
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}
