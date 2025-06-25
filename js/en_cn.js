// 中英文切换功能
document.addEventListener('DOMContentLoaded', function() {
  console.log('[语言切换] 初始化开始...');
  
  // 获取语言切换的菜单项
  const zhLink = document.querySelector('.menus_items .site-page[href="javascript:void(0);"]');
  const enLink = document.querySelector('.menus_items .site-page[href="/en/"]');
  
  console.log('[语言切换] 中文链接元素:', zhLink ? '已找到' : '未找到');
  console.log('[语言切换] 英文链接元素:', enLink ? '已找到' : '未找到');
  
  if (zhLink && enLink) {
    // 中文链接点击事件
    zhLink.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('[语言切换] 中文链接被点击');
      
      // 如果当前URL包含"/en/"，则切换到中文版
      if (window.location.pathname.includes('/en/')) {
        console.log('[语言切换] 当前在英文页面，准备切换到中文页面');
        // 将"/en/"从路径中移除，转到中文页面
        const newPath = window.location.pathname.replace('/en/', '/');
        console.log('[语言切换] 新路径:', newPath);
        // 强制导航到根路径，避免保留/en/路径
        window.location.href = window.location.origin + newPath;
      } else {
        console.log('[语言切换] 已经在中文页面，无需切换');
      }
    });
    
    // 英文链接点击事件 - 确保点击时也能正确切换
    enLink.addEventListener('click', function(e) {
      console.log('[语言切换] 英文链接被点击');
      if (!window.location.pathname.includes('/en/')) {
        console.log('[语言切换] 当前在中文页面，准备切换到英文页面');
        e.preventDefault();
        // 当前在中文页面，需要切换到英文页面
        let newPath = window.location.pathname;
        if (newPath === '/') {
          newPath = '/en/';
        } else {
          newPath = '/en' + newPath;
        }
        console.log('[语言切换] 新路径:', newPath);
        window.location.href = window.location.origin + newPath;
      } else {
        console.log('[语言切换] 已经在英文页面，无需切换');
      }
    });
    
    // 判断当前页面是否为英文版
    const isEnglish = window.location.pathname.includes('/en/');
    console.log('[语言切换] 当前页面语言:', isEnglish ? '英文' : '中文');
    
    if (isEnglish) {
      // 如果是英文版，高亮英文链接
      enLink.classList.add('active');
      console.log('[语言切换] 高亮英文链接');
    } else {
      // 如果是中文版，高亮中文链接
      zhLink.classList.add('active');
      console.log('[语言切换] 高亮中文链接');
    }
  } else {
    console.log('[语言切换] 错误：无法找到语言切换链接');
  }
  
  console.log('[语言切换] 初始化完成');
}); 