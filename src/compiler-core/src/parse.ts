import { NodeTypes, TagTypes } from "./ast";

export function baseParse(content: string) {

  const context = createParserContext(content);
  return createRoot(parseChildren(context, [])); // 初始时 ancestors 栈为空
}

function parseChildren(context, ancestors) {
  const nodes: any = [];

  // 重复执行，没有结束的时候就一直重复执行
  while(!isEnd(context, ancestors)){
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
  
    // 解析 Text
    if(!node){
      node = parseText(context);
    }
  
    nodes.push(node);
  }

  return nodes;
}

function parseText(context: any){

  let endIndex = context.source.length;
  // let endToken = "{{";
  // 处理 edge case 1
  let endTokens = ["{{", "<"];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    // 让 index 尽可能的小，靠左
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  // 获取 content
  const content = parseTextData(context, endIndex);
  console.log("content -----------", content);

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseElement(context: any, ancestors) {
  // 1. 解析两个 tag
  const element: any = parseTag(context, TagTypes.START);
  // 此处把 tag 存入栈中，下面的 parseChildren 会递归执行 parseElement，遇到 tag 再次存进来
  ancestors.push(element);
  // 2. 解析 tag 之间的 children
  element.children = parseChildren(context, ancestors);
  ancestors.pop(); // children 执行完成之后

  console.log(context.source); // </div>
  console.log(element.tag); // span
  // 相等的时候 才能处理
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagTypes.END);
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }

  return element;
}

function parseTag(context: any, type: TagTypes) {
  console.log(context);
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
// 判断结束
function isEnd(context, ancestors) {
  // 2. 遇到结束标签的时候
  const s = context.source;
  // if (parentTag && s.startsWith(`</${parentTag}>`)){ // 初始化时 parentTag 为空,不需要走此流程
  //   return true;
  // }
  // </div>
  if(s.startsWith("</")){
    // for(let i = 0; i < ancestors.length; i++) {
    //从栈顶开始查，从后往前循环遍历，对于此逻辑来说 性能更好，因为正常情况下我们要找到的tag 是在后面的，这样可以减少查找的次数
    for(let i = ancestors.length - 1; i >= 0; i--){
      const tag = ancestors[i].tag;
      if(startsWithEndTagOpen(s, tag)){
        return true;
      }
    }
  }
  // 1. source 有值的时候,返回 false 不结束
  return !s;
}
function startsWithEndTagOpen(source, tag) {
  // return source.slice(2, 2 + tag.length) === tag;
  return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
