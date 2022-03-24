
class reactiveEffect{
  private _fn: any;

  constructor(fn, public scheduler?){
    this._fn = fn;
  }

  run(){
    activeEffect = this;
    // runner方法需要得到fn的返回值
    return this._fn();
  }
}

const targetMap = new Map();
export function track(target, key) {
  // target -> key -> dep
  // targetMap -> { target: depsMap }
  // depsMap -> {key: dep}
  // dep -> activeEffect

  let depsMap = targetMap.get(target);
  if(!depsMap){
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if(!dep){
    dep = new Set();
    depsMap.set(key, dep);
  }

  dep.add(activeEffect);
}

export function trigger(target, key){
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);
  for (const effect of dep) {
    if(effect.scheduler){
      effect.scheduler()
    }else{
      effect.run();
    }
  }
}

let activeEffect;
export function effect(fn, options:any = {}){
  const _effect = new reactiveEffect(fn, options.scheduler);

  _effect.run();

  // 返回的 runner函数
  // run方法用到了this,使用bind处理指针问题
  return _effect.run.bind(_effect);
}