// 每日诗词 - 实时获取
document.addEventListener('DOMContentLoaded', function() {
  console.log('[诗词] 初始化开始...');
  
  // 全局默认诗词列表 - 导出为全局变量供其他组件使用
  window.defaultPoemList = [
    '唯有生活和好女孩不可辜负'
  ];
  
  // 如果已经初始化过，则不再重复初始化
  if (window.jinrishiciInitialized) {
    console.log('[诗词] 已经初始化过，跳过');
    return;
  }
  
  // 清理可能存在的旧诗词缓存 - 确保配置修改后立即生效
  const cleanupOldCache = () => {
    // 检查默认诗词是否已更新（通过特殊标记）
    const defaultPoemVersion = "v1"; // 更改此版本号可以强制清除缓存
    const savedVersion = localStorage.getItem('jinrishici_default_version');
    
    if (savedVersion !== defaultPoemVersion) {
      console.log('[诗词] 检测到默认诗词配置已更改，清理缓存');
      localStorage.removeItem('jinrishici_poem');
      localStorage.removeItem('jinrishici_timestamp');
      localStorage.removeItem('jinrishici_last_poem');
      localStorage.removeItem('jinrishici_has_realtime');
      
      // 更新版本标记
      localStorage.setItem('jinrishici_default_version', defaultPoemVersion);
      return true;
    }
    
    return false;
  };
  
  // 执行缓存清理
  const cacheCleared = cleanupOldCache();
  
  const fetchJinrishici = () => {
    // 默认诗词列表（当API不可用时使用） - 使用全局变量
    const defaultPoems = window.defaultPoemList;
    
    // 获取用于显示的容器
    const subtitleEl = document.getElementById('subtitle');
    if (!subtitleEl) {
      console.log('[诗词] 错误：找不到subtitle元素');
      return;
    }
    
    // 防止重复加载，设置标志
    if (window.isLoadingPoem) {
      console.log('[诗词] 警告：已有加载进程正在运行，跳过本次加载');
      return;
    }
    
    console.log('[诗词] 设置加载标志：isLoadingPoem = true');
    window.isLoadingPoem = true;
    
    // 打字机效果的统一配置 - 对默认内容使用循环，对实时内容不使用循环
    const getTypedConfig = (isDefaultPoem) => {
      return {
        startDelay: 300,
        typeSpeed: 65,   // 打字速度
        backSpeed: 30,   // 回退速度
        backDelay: 1500, // 停留时间
        loop: false,     // 不使用循环模式，避免内容来回切换
        showCursor: true
      };
    };
    
    // 从localStorage中检查是否已获取过实时数据
    const loadRealTimeStatus = () => {
      const hasRealTimePoem = localStorage.getItem('jinrishici_has_realtime') === 'true';
      console.log('[诗词] 从localStorage加载实时数据状态:', hasRealTimePoem);
      return hasRealTimePoem;
    };
    
    // 将实时数据状态保存到localStorage
    const saveRealTimeStatus = (status) => {
      localStorage.setItem('jinrishici_has_realtime', status.toString());
      console.log('[诗词] 保存实时数据状态到localStorage:', status);
    };
    
    // 上次加载的诗句 - 从localStorage获取以保持状态
    window.lastLoadedPoem = localStorage.getItem('jinrishici_last_poem') || '';
    console.log('[诗词] 从localStorage加载上次诗句:', window.lastLoadedPoem);
    
    // 检查上次加载的诗句是否在默认列表中（避免显示已删除的诗句）
    if (window.lastLoadedPoem && !defaultPoems.includes(window.lastLoadedPoem)) {
      // 检查是否为API获取的实时诗句
      const savedPoem = localStorage.getItem('jinrishici_poem');
      if (window.lastLoadedPoem !== savedPoem) {
        console.log('[诗词] 上次加载的诗句不在默认列表中且非API数据，清除:', window.lastLoadedPoem);
        window.lastLoadedPoem = '';
        localStorage.removeItem('jinrishici_last_poem');
      }
    }
    
    // 标记是否已从API获取到了实时数据 - 从localStorage恢复状态
    window.hasRealTimePoem = loadRealTimeStatus();
    
    // 销毁旧的打字机实例 - 彻底清理
    const destroyTyped = () => {
      if (window.typed) {
        try {
          window.typed.destroy();
          window.typed = null;
          console.log('[诗词] 成功销毁旧打字机实例');
        } catch (error) {
          console.log('[诗词] 销毁打字机实例失败:', error);
          window.typed = null;
        }
      }
    };
    
    // 显示诗句的函数 - 只有在需要时才创建新实例
    const displayPoem = (poem, isArray = false, source = '未知') => {
      // 记录实际要显示的诗句，用于日志和调试
      const displayContent = isArray ? '多条诗句' : poem;
      console.log(`[诗词] 准备显示诗句，来源: ${source}`, displayContent);
      
      // 如果新的诗句与上次显示的相同，则不重复显示
      if (poem === window.lastLoadedPoem && !isArray) {
        console.log('[诗词] 新诗句与上次显示的相同，跳过显示：', poem);
        window.isLoadingPoem = false;
        return;
      }
      
      // 当从默认诗句切换到实时诗句时，需要完全销毁和重建打字机实例
      const isDefaultPoem = source.includes('默认');
      
      // 如果要从实时数据切换到默认数据，绝对不允许切换
      if (window.hasRealTimePoem && isDefaultPoem) {
        console.log('[诗词] 已有实时数据，强制跳过显示默认诗句');
        window.isLoadingPoem = false;
        return;
      }
      
      // 更新上次加载的诗句 - 确保更新在实际显示之前
      if (!isArray) {
        window.lastLoadedPoem = poem;
        // 保存到localStorage以在页面切换后恢复
        localStorage.setItem('jinrishici_last_poem', poem);
        console.log('[诗词] 更新lastLoadedPoem并保存到localStorage:', poem);
      }
      
      // 销毁旧实例并创建新实例
      console.log('[诗词] 创建新的打字机实例');
      destroyTyped();
      
      // 记录当前诗句类型
      window.currentPoemIsDefault = isDefaultPoem;
      
      // 延迟显示，防止闪烁
      setTimeout(() => {
        try {
          const strings = isArray ? poem : [poem];
          const config = getTypedConfig(isDefaultPoem);
          
          window.typed = new Typed('#subtitle', {
            strings: strings,
            ...config
          });
          console.log('[诗词] 打字机实例创建成功，内容:', displayContent);
        } catch (error) {
          console.log('[诗词] 创建打字机实例失败:', error);
        }
        
        console.log('[诗词] 重置加载标志：isLoadingPoem = false');
        window.isLoadingPoem = false;
      }, 300);
    };
    
    // 尝试从本地存储获取之前的诗词
    const savedPoem = localStorage.getItem('jinrishici_poem');
    const timestamp = localStorage.getItem('jinrishici_timestamp');
    const now = Date.now();
    
    // 打印缓存信息
    console.log('[诗词] 检查本地存储:', {
      hasSavedPoem: !!savedPoem,
      hasTimestamp: !!timestamp,
      savedTime: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : '无',
      age: timestamp ? Math.floor((now - parseInt(timestamp)) / (60 * 60 * 1000)) + '小时' : '无'
    });

    // 打印缓存的诗句内容
    if (savedPoem) {
      console.log('[诗词] 当前缓存的诗句:', savedPoem);
    }
    
    // 检查是否有保存的诗词，且未过期（24小时内）
    if (savedPoem && timestamp && (now - parseInt(timestamp) < 24 * 60 * 60 * 1000)) {
      // 先显示缓存的诗句，以减少等待
      console.log('[诗词] 优先使用缓存的诗句:', savedPoem);
      displayPoem(savedPoem, false, '本地缓存');
      
      // 标记已有实时数据
      window.hasRealTimePoem = true;
      saveRealTimeStatus(true);
      console.log('[诗词] 设置hasRealTimePoem = true（从缓存）');
      
      // 如果缓存时间小于30分钟，则不再请求API
      if (now - parseInt(timestamp) < 30 * 60 * 1000) {
        console.log('[诗词] 缓存时间小于30分钟，不再请求API');
        return;
      }
    } else if (!window.hasRealTimePoem) {
      // 如果没有缓存且没有实时数据，才使用默认诗句
      console.log('[诗词] 无有效缓存且无实时数据，暂时使用默认诗句');
      displayPoem(defaultPoems[0], false, '默认诗句');
    } else if (window.lastLoadedPoem) {
      // 如果有实时数据状态和上次加载的诗句，直接显示
      console.log('[诗词] 已有实时数据和上次诗句，显示上次诗句:', window.lastLoadedPoem);
      displayPoem(window.lastLoadedPoem, false, '恢复上次显示');
    } else {
      console.log('[诗词] 已有实时数据标记，但无上次诗句，等待API获取');
    }
    
    // 避免短时间内多次请求API
    // 如果已经有缓存了，延长等待时间，减少不必要的更新
    const apiDelay = savedPoem ? 5000 : 1000;
    console.log(`[诗词] 等待${apiDelay/1000}秒后请求API...`);
    
    setTimeout(() => {
      // 如果页面已经关闭或跳转，不再继续请求
      if (!document.getElementById('subtitle')) {
        console.log('[诗词] 页面已关闭或跳转，取消API请求');
        window.isLoadingPoem = false;
        return;
      }
      
      // 然后尝试获取实时诗词
      console.log('[诗词] 开始请求金山词霸API...');
      fetch('https://v2.jinrishici.com/one.json')
        .then(response => {
          console.log('[诗词] API响应状态:', response.status);
          if (!response.ok) throw new Error('网络响应异常: ' + response.status);
          return response.json();
        })
        .then(result => {
          console.log('[诗词] API响应数据:', JSON.stringify(result).substring(0, 200) + '...');
          
          // 判断API返回是否成功
          if (result && result.status === 'success' && result.data && result.data.content) {
            const poem = result.data.content;
            // 只打印获取到的诗句内容
            console.log('[诗词] 成功获取到的诗句:', poem);
            
            // 标记已获取到实时数据
            window.hasRealTimePoem = true;
            saveRealTimeStatus(true);
            console.log('[诗词] 设置hasRealTimePoem = true（从API）');
            
            // 仅当诗句与当前显示不同时才更新
            if (poem !== window.lastLoadedPoem) {
              console.log('[诗词] 获取的诗句与当前显示不同，更新显示');
              console.log('[诗词] 当前显示:', window.lastLoadedPoem);
              console.log('[诗词] 新诗句:', poem);
              displayPoem(poem, false, 'API实时获取');
              
              // 保存到本地存储，带过期时间（一天）
              console.log('[诗词] 保存诗句到本地存储');
              localStorage.setItem('jinrishici_poem', poem);
              localStorage.setItem('jinrishici_timestamp', now);
            } else {
              console.log('[诗词] 获取的诗句与当前显示相同，无需更新');
              window.isLoadingPoem = false;
            }
          } else {
            console.log('[诗词] API返回成功但格式异常:', result);
            throw new Error('API返回格式异常');
          }
        })
        .catch(error => {
          console.log('[诗词] 获取诗词失败:', error.message);
          
          // 如果API请求失败且我们没有实时数据，才使用默认诗句列表
          if (!window.hasRealTimePoem) {
            console.log('[诗词] 无实时数据，使用默认诗句');
            // 使用单个默认诗句，避免循环多个诗句造成闪烁
            displayPoem(defaultPoems[0], false, '默认诗句');
          } else {
            console.log('[诗词] 已有实时数据，保持当前显示');
            window.isLoadingPoem = false;
          }
        });
    }, apiDelay);
  };

  // 初始化一次
  fetchJinrishici();
  
  // 为防止重复初始化，记录初始化状态
  window.jinrishiciInitialized = true;
  console.log('[诗词] 初始化完成，设置jinrishiciInitialized = true');
});