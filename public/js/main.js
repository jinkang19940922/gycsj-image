// 全局变量
let selectMode = false;
let selectedImages = new Set();
let uploadMode = 'select';
let currentPage = 'gallery';
let currentGroupFilter = '';
let allGroups = [];
let siteSettings = {};
let totalImagesCount = 0; // 存储真实的图片总数
let currentImageList = []; // 当前预览的图片列表
let currentImageIndex = 0; // 当前预览图片索引
let currentZoom = 1; // 当前缩放比例
let isFullscreen = false; // 是否全屏
let bingWallpaperList = []; // 必应壁纸列表
let isPreviewingBingWallpapers = false; // 是否正在预览必应壁纸
let modalImageContainer = null; // 模态框图片容器
let isDragging = false; // 是否正在拖拽
let dragStartX = 0; // 拖拽开始X坐标
let dragStartY = 0; // 拖拽开始Y坐标
let dragTranslateX = 0; // 拖拽X偏移
let dragTranslateY = 0; // 拖拽Y偏移

// DOM 元素
const loginPage = document.getElementById('loginPage');
const navbar = document.getElementById('navbar');
const galleryPage = document.getElementById('galleryPage');
const uploadPage = document.getElementById('uploadPage');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const imageGrid = document.getElementById('imageGrid');
const toast = document.getElementById('toast');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const batchSelectBtn = document.getElementById('batchSelectBtn');
const batchActions = document.getElementById('batchActions');

// 初始化
checkAuth();
loadTheme();
loadSiteSettings();
loadLoginBackground();

// 切换页面
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  if (page === 'gallery') {
    galleryPage.classList.add('active');
    galleryPage.style.display = 'block';
    document.getElementById('navGallery').classList.add('active');
    loadGroups();
    loadImages();
  } else if (page === 'upload') {
    uploadPage.classList.add('active');
    uploadPage.style.display = 'block';
    document.getElementById('navUpload').classList.add('active');
    loadGroupsForUpload();
  } else if (page === 'public') {
    document.getElementById('publicPage').classList.add('active');
    document.getElementById('publicPage').style.display = 'block';
    document.getElementById('navPublic').classList.add('active');
    loadBingWallpapers();
  } else if (page === 'api') {
    document.getElementById('apiPage').classList.add('active');
    document.getElementById('apiPage').style.display = 'block';
    document.getElementById('navApi').classList.add('active');
    initApiPage();
  }
}

// 登录
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  loginBtn.disabled = true;
  loginBtn.textContent = '登录中...';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('登录成功', 'success');
      checkAuth();
    } else {
      showToast(data.error || '登录失败', 'error');
    }
  } catch (error) {
    showToast('网络错误', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '登录';
  }
});

// 检查登录状态
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();

    if (data.loggedIn) {
      loginPage.style.display = 'none';
      navbar.style.display = 'flex';
      userInfo.textContent = `👤 ${data.username}`;
      galleryPage.style.display = 'block';
      uploadPage.style.display = 'block';
      document.getElementById('apiPage').style.display = 'block';
      document.getElementById('publicPage').style.display = 'block';
      switchPage('gallery');
      loadApiConfig();
    } else {
      loginPage.style.display = 'flex';
      navbar.style.display = 'none';
      galleryPage.style.display = 'none';
      uploadPage.style.display = 'none';
      document.getElementById('apiPage').style.display = 'none';
      document.getElementById('publicPage').style.display = 'none';
    }
  } catch (error) {
    loginPage.style.display = 'flex';
    navbar.style.display = 'none';
    galleryPage.style.display = 'none';
    uploadPage.style.display = 'none';
    document.getElementById('apiPage').style.display = 'none';
    document.getElementById('publicPage').style.display = 'none';
  }
}

// 登出
async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    showToast('已退出登录', 'success');
    checkAuth();
  } catch (error) {
    showToast('登出失败', 'error');
  }
}

// 打开设置
function openSettings() {
  document.getElementById('settingsModal').classList.add('show');
  document.getElementById('settingsForm').reset();
  loadSiteSettingsToForm();
}

// 关闭设置
function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

// 切换设置选项卡
function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tab + 'Panel').classList.add('active');
}

// 更新账户信息
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newUsername = document.getElementById('newUsername').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('两次输入的新密码不一致', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('密码长度至少 6 位', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = '保存中...';

  try {
    const response = await fetch('/api/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newUsername, newPassword })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast(data.message, 'success');
      userInfo.textContent = `👤 ${data.username}`;
      closeSettings();
    } else {
      showToast(data.error || '修改失败', 'error');
    }
  } catch (error) {
    showToast('网络错误', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '保存修改';
  }
});

// 站点设置表单
document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const siteTitle = document.getElementById('siteTitleInput').value.trim();
  const siteLogo = document.getElementById('siteLogoInput').value.trim();
  const siteFavicon = document.getElementById('siteFaviconInput').value.trim();
  
  siteSettings = {
    title: siteTitle || '光影穿梭机 HOME',
    logo: siteLogo,
    favicon: siteFavicon
  };
  
  localStorage.setItem('siteSettings', JSON.stringify(siteSettings));
  applySiteSettings(siteSettings);
  showToast('站点设置已保存', 'success');
  closeSettings();
});

// 加载站点设置
function loadSiteSettings() {
  const saved = localStorage.getItem('siteSettings');
  if (saved) {
    siteSettings = JSON.parse(saved);
    applySiteSettings(siteSettings);
  }
}

// 加载站点设置到表单
function loadSiteSettingsToForm() {
  document.getElementById('siteTitleInput').value = siteSettings.title || '';
  document.getElementById('siteLogoInput').value = siteSettings.logo || '';
  document.getElementById('siteFaviconInput').value = siteSettings.favicon || '';
}

// 应用站点设置
function applySiteSettings(settings) {
  if (settings.title) {
    document.getElementById('siteTitle').textContent = settings.title;
    document.getElementById('navTitle').textContent = settings.title;
    document.getElementById('loginTitle').textContent = settings.title;
  }
  
  if (settings.favicon) {
    document.getElementById('siteIcon').href = settings.favicon;
  }
}

// 切换主题
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const btn = document.getElementById('themeBtn');
  
  if (currentTheme === 'dark') {
    html.setAttribute('data-theme', 'light');
    btn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    btn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

// 加载主题
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const btn = document.getElementById('themeBtn');
  if (savedTheme === 'dark') {
    btn.textContent = '☀️';
  }
}

// 设置上传模式
function setUploadMode(mode) {
  uploadMode = mode;
  document.getElementById('selectModeBtn').classList.toggle('active', mode === 'select');
  document.getElementById('folderModeBtn').classList.toggle('active', mode === 'folder');
  
  if (mode === 'select') {
    dropZone.querySelector('.drop-zone-icon').textContent = '📁';
    dropZone.querySelector('.drop-zone-text strong').textContent = '点击选择';
  } else {
    dropZone.querySelector('.drop-zone-icon').textContent = '📂';
    dropZone.querySelector('.drop-zone-text strong').textContent = '选择文件夹';
  }
}

// 点击上传区域
dropZone.addEventListener('click', () => {
  if (uploadMode === 'select') {
    fileInput.click();
  } else {
    folderInput.click();
  }
});

// 文件选择
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) uploadFiles(files);
  fileInput.value = '';
});

// 文件夹选择
folderInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length > 0) {
    if (files.length > 100) {
      showToast('最多支持 100 张图片，已选择前 100 张', 'error');
    }
    uploadFiles(files.slice(0, 100));
  }
  folderInput.value = '';
});

// 拖拽事件
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  if (files.length > 0) uploadFiles(files);
});

// 上传文件
async function uploadFiles(files) {
  if (files.length === 0) return;

  const batchSize = 100;
  if (files.length > batchSize) {
    showToast(`共 ${files.length} 张图片，将分批上传`, 'success');
    const batches = Math.ceil(files.length / batchSize);
    for (let i = 0; i < batches; i++) {
      const batch = files.slice(i * batchSize, (i + 1) * batchSize);
      showToast(`上传第 ${i + 1}/${batches} 批 (${batch.length} 张)`, 'success');
      await uploadBatch(batch);
    }
    showToast('全部上传完成！', 'success');
    switchPage('gallery');
    return;
  }

  await uploadBatch(files);
}

// 上传单个批次
async function uploadBatch(files) {
  if (files.length === 0) return;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = `准备上传 ${files.length} 张图片 (${totalSizeMB}MB)...`;

  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }
  
  const groupId = document.getElementById('uploadGroup')?.value || '';
  if (groupId) {
    formData.append('groupId', groupId);
  }

  try {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressFill.style.width = percent + '%';
        progressText.textContent = `上传中 ${Math.round(percent)}% (${files.length} 张)`;
      }
    });

    xhr.addEventListener('load', () => {
      progressContainer.style.display = 'none';

      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        showToast(`成功上传 ${result.images.length} 张图片`, 'success');
        switchPage('gallery');
      } else if (xhr.status === 401) {
        showToast('请先登录', 'error');
        checkAuth();
      } else {
        const error = JSON.parse(xhr.responseText);
        showToast(error.error || '上传失败', 'error');
      }
    });

    xhr.addEventListener('error', () => {
      progressContainer.style.display = 'none';
      showToast('网络错误，上传失败', 'error');
    });

    xhr.open('POST', '/api/upload/multiple');
    xhr.send(formData);
  } catch (error) {
    progressContainer.style.display = 'none';
    showToast('上传失败：' + error.message, 'error');
  }
}

// 加载图片
async function loadImages() {
  try {
    let url = '/api/images';
    if (currentGroupFilter) {
      url = `/api/categories/${currentGroupFilter}/images`;
    }
    
    const response = await fetch(url);
    if (response.status === 401) { checkAuth(); return; }

    const data = await response.json();

    if (data.success && data.images && data.images.length > 0) {
      currentImageList = data.images;
      const html = data.images.map((img, index) => {
        const urlAttr = img.url.replace(/"/g, '&quot;');
        const filenameAttr = img.filename.replace(/"/g, '&quot;');
        const isSelected = selectedImages.has(img.filename);
        return `
        <div class="image-card${selectMode ? ' select-mode' : ''}${isSelected ? ' selected' : ''}" data-url="${urlAttr}" data-filename="${filenameAttr}" data-index="${index}" onclick="onImageCardClick(this, event)">
          <div class="checkbox-overlay" onclick="event.stopPropagation(); toggleImageSelection(this.parentElement)">
            <div class="checkbox-custom${isSelected ? ' checked' : ''}"></div>
          </div>
          <div class="image-preview">
            <img src="${img.thumbnail}" alt="${img.filename}">
            <div class="preview-overlay">
              <span class="preview-icon">🔍</span>
              <span class="preview-text">点击查看大图</span>
            </div>
          </div>
          <div class="image-info" onclick="event.stopPropagation()">
            <div class="image-filename">${img.filename}</div>
            <div class="image-actions">
              <div class="format-dropdown">
                <button class="action-btn copy-format-btn" onclick="toggleFormatMenu(this)">📋 复制</button>
                <div class="format-menu">
                  <button onclick="copyUrl(this)">图片链接</button>
                  <button onclick="copyMarkdown(this)">Markdown</button>
                  <button onclick="copyBBCode(this)">BBCode</button>
                  <button onclick="copyHTML(this)">HTML</button>
                </div>
              </div>
              <button class="action-btn delete-btn" onclick="deleteImage('${img.filename.replace(/'/g, "\\'")}')">删除</button>
            </div>
          </div>
        </div>`;
      }).join('');
      imageGrid.innerHTML = html;
    } else {
      currentImageList = [];
      imageGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div>暂无图片，去上传第一张图片吧！</div>
        </div>`;
    }
  } catch (error) {
    showToast('加载图片失败', 'error');
  }
}

// 图片卡片点击事件
function onImageCardClick(card, event) {
  if (selectMode) {
    toggleImageSelection(card);
  } else {
    showModalPreview(card);
  }
}

// 切换格式菜单
function toggleFormatMenu(btn) {
  const menu = btn.nextElementSibling;
  document.querySelectorAll('.format-menu').forEach(m => {
    if (m !== menu) m.classList.remove('show');
  });
  menu.classList.toggle('show');
  event.stopPropagation();
}

// 获取图片数据
function getImageData(btn) {
  const card = btn.closest('.image-card');
  return {
    url: card.dataset.url,
    filename: card.dataset.filename
  };
}

// 复制函数
function copyUrl(btn) {
  const { url } = getImageData(btn);
  copyToClipboard(url, '链接已复制到剪贴板');
  closeAllMenus();
}

function copyMarkdown(btn) {
  const { url, filename } = getImageData(btn);
  copyToClipboard(`![${filename}](${url})`, 'Markdown 已复制到剪贴板');
  closeAllMenus();
}

function copyBBCode(btn) {
  const { url, filename } = getImageData(btn);
  copyToClipboard(`[img]${url}[/img]`, 'BBCode 已复制到剪贴板');
  closeAllMenus();
}

function copyHTML(btn) {
  const { url, filename } = getImageData(btn);
  copyToClipboard(`<img src="${url}" alt="${filename}">`, 'HTML 已复制到剪贴板');
  closeAllMenus();
}

function closeAllMenus() {
  document.querySelectorAll('.format-menu').forEach(m => m.classList.remove('show'));
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    showToast(successful ? successMsg : '复制失败', successful ? 'success' : 'error');
  } catch (err) {
    showToast('复制失败', 'error');
  }
  document.body.removeChild(textArea);
}

// 批量选择
function toggleSelectMode() {
  selectMode = !selectMode;
  
  const btnIcon = batchSelectBtn.querySelector('.btn-icon');
  const btnText = batchSelectBtn.querySelector('.btn-text');
  
  if (selectMode) {
    batchSelectBtn.classList.add('active');
    btnIcon.textContent = '✕';
    btnText.textContent = '取消管理';
    batchActions.style.display = 'flex';
    updateMoveToGroupSelect();
  } else {
    batchSelectBtn.classList.remove('active');
    btnIcon.textContent = '☑️';
    btnText.textContent = '批量管理';
    batchActions.style.display = 'none';
    selectedImages.clear();
  }
  
  updateSelectedCount();
  
  document.querySelectorAll('.image-card').forEach(card => {
    if (selectMode) {
      card.classList.add('select-mode');
    } else {
      card.classList.remove('select-mode');
      card.classList.remove('selected');
      const checkbox = card.querySelector('.checkbox-custom');
      if (checkbox) checkbox.classList.remove('checked');
    }
  });
}

function toggleImageSelection(card) {
  const filename = card.dataset.filename;
  const checkbox = card.querySelector('.checkbox-custom');
  
  if (selectedImages.has(filename)) {
    selectedImages.delete(filename);
    card.classList.remove('selected');
    if (checkbox) checkbox.classList.remove('checked');
  } else {
    selectedImages.add(filename);
    card.classList.add('selected');
    if (checkbox) checkbox.classList.add('checked');
  }
  updateSelectedCount();
}

function selectAllImages() {
  const allImages = Array.from(document.querySelectorAll('.image-card'));
  if (selectedImages.size === allImages.length) {
    selectedImages.clear();
    allImages.forEach(card => {
      card.classList.remove('selected');
      const checkbox = card.querySelector('.checkbox-custom');
      if (checkbox) checkbox.classList.remove('checked');
    });
  } else {
    selectedImages.clear();
    allImages.forEach(card => {
      selectedImages.add(card.dataset.filename);
      card.classList.add('selected');
      const checkbox = card.querySelector('.checkbox-custom');
      if (checkbox) checkbox.classList.add('checked');
    });
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const countEl = document.getElementById('selectedCount');
  countEl.innerHTML = `已选择 <b>${selectedImages.size}</b> 张`;
}

// 删除图片
async function deleteImage(filename) {
  if (!confirm('确定要删除这张图片吗？')) return;
  
  try {
    const response = await fetch(`/api/images/${filename}`, { method: 'DELETE' });
    if (response.status === 401) { checkAuth(); return; }
    
    const data = await response.json();
    if (data.success) {
      showToast('删除成功', 'success');
      loadImages();
    } else {
      showToast(data.error || '删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// 删除选中的图片
async function deleteSelectedImages() {
  if (selectedImages.size === 0) {
    showToast('请先选择要删除的图片', 'error');
    return;
  }
  
  if (!confirm(`确定要删除选中的 ${selectedImages.size} 张图片吗？`)) return;
  
  try {
    let successCount = 0;
    for (const filename of selectedImages) {
      const response = await fetch(`/api/images/${filename}`, { method: 'DELETE' });
      if (response.ok) {
        successCount++;
      }
    }
    
    showToast(`成功删除 ${successCount} 张图片`, 'success');
    selectedImages.clear();
    updateSelectedCount();
    loadImages();
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// 显示图片预览
function showModalPreview(card) {
  const url = card.dataset.url;
  const index = parseInt(card.dataset.index) || 0;
  currentImageIndex = index;
  currentZoom = 1;
  modalImageContainer = document.getElementById('modalImageContainer');
  updateModalImage(url);
  imageModal.classList.add('show');
}

function updateModalImage(url) {
  const modalImage = document.getElementById('modalImage');
  const downloadBtn = document.getElementById('modalDownloadBtn').querySelector('a');
  modalImage.src = url;
  
  // 重置缩放和拖拽位置
  currentZoom = 1;
  resetDrag();
  modalImage.style.transform = 'scale(1)';
  modalImage.style.transformOrigin = 'center center';
  modalImage.style.width = '100%';
  modalImage.style.height = 'auto';
  modalImage.style.maxWidth = 'none';
  modalImage.style.maxHeight = 'none';
  modalImage.style.cursor = 'default';
  
  if (modalImageContainer) {
    modalImageContainer.scrollTop = 0;
    modalImageContainer.scrollLeft = 0;
  }
  downloadBtn.href = url;
  
  let filename = 'image.jpg';
  if (isPreviewingBingWallpapers) {
    filename = bingWallpaperList[currentImageIndex]?.title || 'bing-wallpaper.jpg';
    if (!filename.includes('.')) filename += '.jpg';
  } else {
    filename = currentImageList[currentImageIndex]?.filename || 'image.jpg';
  }
  downloadBtn.download = filename;
}

// 放大图片
function zoomIn(event) {
  if (event) event.stopPropagation();
  currentZoom = currentZoom + 0.25;
  applyZoom();
}

// 缩小图片
function zoomOut(event) {
  if (event) event.stopPropagation();
  currentZoom = Math.max(currentZoom - 0.25, 0.1);
  applyZoom();
}

// 重置缩放
function zoomReset(event) {
  if (event) event.stopPropagation();
  currentZoom = 1;
  resetDrag();
  applyZoom();
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.style.cursor = 'default';
  }
}

function applyZoom() {
  const modalImage = document.getElementById('modalImage');
  const modal = document.getElementById('imageModal');

  if (modalImage) {
    // 使用transform scale和translate来实现放大缩小和拖拽
    modalImage.style.transform = `translate(${dragTranslateX}px, ${dragTranslateY}px) scale(${currentZoom})`;
    modalImage.style.transformOrigin = 'center center';
    modalImage.style.width = '100%';
    modalImage.style.height = 'auto';
    modalImage.style.maxWidth = 'none';
    modalImage.style.maxHeight = 'none';
  }
}

// 初始化图片拖拽功能
function initImageDrag() {
  const modalImage = document.getElementById('modalImage');
  const container = document.getElementById('modalImageContainer');

  if (!modalImage || !container) return;

  // 鼠标按下开始拖拽
  modalImage.addEventListener('mousedown', (e) => {
    if (currentZoom <= 1) return; // 只有放大时才允许拖拽
    isDragging = true;
    dragStartX = e.clientX - dragTranslateX;
    dragStartY = e.clientY - dragTranslateY;
    modalImage.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // 鼠标移动时拖拽
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragTranslateX = e.clientX - dragStartX;
    dragTranslateY = e.clientY - dragStartY;
    applyZoom();
  });

  // 鼠标松开结束拖拽
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      modalImage.style.cursor = currentZoom > 1 ? 'grab' : 'default';
    }
  });

  // 双击重置位置和缩放
  modalImage.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    currentZoom = 1;
    dragTranslateX = 0;
    dragTranslateY = 0;
    applyZoom();
    modalImage.style.cursor = 'default';
  });
}

// 重置拖拽位置
function resetDrag() {
  dragTranslateX = 0;
  dragTranslateY = 0;
}

// 切换全屏
function toggleFullscreen(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById('imageModal');
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  
  if (!document.fullscreenElement) {
    modal.requestFullscreen().catch(err => {
      console.log('全屏请求失败:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// 上一张图片
function prevImage(event) {
  if (event) event.stopPropagation();
  const list = isPreviewingBingWallpapers ? bingWallpaperList : currentImageList;
  if (list.length === 0) return;
  
  currentImageIndex = (currentImageIndex - 1 + list.length) % list.length;
  currentZoom = 1;
  const img = list[currentImageIndex];
  updateModalImage(img.url);
}

// 下一张图片
function nextImage(event) {
  if (event) event.stopPropagation();
  const list = isPreviewingBingWallpapers ? bingWallpaperList : currentImageList;
  if (list.length === 0) return;
  
  currentImageIndex = (currentImageIndex + 1) % list.length;
  currentZoom = 1;
  const img = list[currentImageIndex];
  updateModalImage(img.url);
}

// 关闭图片预览
function closeModal() {
  imageModal.classList.remove('show');
  currentZoom = 1;
  isPreviewingBingWallpapers = false;
  if (document.fullscreenElement) {
    document.exitFullscreen();
    isFullscreen = false;
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    fullscreenIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
  }
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (!imageModal.classList.contains('show')) return;
  
  switch(e.key) {
    case 'Escape':
      closeModal();
      break;
    case 'ArrowLeft':
      prevImage(e);
      break;
    case 'ArrowRight':
      nextImage(e);
      break;
    case '+':
    case '=':
      zoomIn(e);
      break;
    case '-':
      zoomOut(e);
      break;
    case '0':
      zoomReset(e);
      break;
    case 'f':
    case 'F':
      toggleFullscreen(e);
      break;
  }
});

// 全屏状态变化监听
document.addEventListener('fullscreenchange', () => {
  const fullscreenIcon = document.getElementById('fullscreenIcon');
  if (fullscreenIcon) {
    if (document.fullscreenElement) {
      isFullscreen = true;
      fullscreenIcon.innerHTML = '<path d="M4 14H10V20M20 10H14V4M4 4V10H10M20 20V14H14"></path>';
    } else {
      isFullscreen = false;
      fullscreenIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
    }
  }
  currentZoom = 1;
  applyZoom();
});

// 鼠标滚轮控制放大缩小
function initWheelZoom() {
  const container = document.getElementById('modalImageContainer');
  if (container) {
    container.addEventListener('wheel', (e) => {
      if (!imageModal.classList.contains('show')) return;
      
      e.preventDefault();
      
      if (e.deltaY < 0) {
        // 向上滚动 - 放大
        currentZoom = currentZoom + 0.1;
      } else {
        // 向下滚动 - 缩小
        currentZoom = Math.max(currentZoom - 0.1, 0.1);
      }
      
      applyZoom();
    }, { passive: false });
  }
}

// 初始化滚轮缩放
initWheelZoom();
initImageDrag();

// 显示提示
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// 点击页面其他地方关闭菜单
document.addEventListener('click', () => {
  closeAllMenus();
});

// ============ API工具页面功能 ============

let apiSelectedImages = new Set();
let autoRefreshTimer = null;
let apiAllImages = [];

// 初始化API页面
async function initApiPage() {
  await loadApiCategories();
  await loadApiImages();
  updateQuickApiUrl();
  updateApiUrl();
}

// 加载分类列表
async function loadApiCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    const select = document.getElementById('apiCategory');
    select.innerHTML = '<option value="">全部分组</option>';
    
    if (data.success && data.categories) {
      data.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.name} (${cat.images.length}张)`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

// 加载所有图片用于选择
async function loadApiImages() {
  try {
    const response = await fetch('/api/images');
    const data = await response.json();
    
    if (data.success && data.images) {
      apiAllImages = data.images;
      renderImageSelector();
      // 图片选择器渲染完成后，再次加载API配置以恢复选中的图片（强制重新加载）
      loadApiConfig(true);
    }
  } catch (error) {
    console.error('加载图片失败:', error);
  }
}

// 渲染图片选择器
function renderImageSelector() {
  const grid = document.getElementById('imageSelectorGrid');
  
  if (apiAllImages.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">暂无图片</p>';
    return;
  }
  
  grid.innerHTML = apiAllImages.map(img => `
    <div class="selector-image-card ${apiSelectedImages.has(img.filename) ? 'selected' : ''}" 
         data-filename="${img.filename}" 
         onclick="toggleApiImageSelection(this, '${img.filename}')">
      <img src="${img.thumbnail}" alt="${img.filename}">
      <div class="check-mark">✓</div>
    </div>
  `).join('');
  
  updateSelectedImageCount();
}

// 切换图片选择
function toggleApiImageSelection(card, filename) {
  if (apiSelectedImages.has(filename)) {
    apiSelectedImages.delete(filename);
    card.classList.remove('selected');
  } else {
    apiSelectedImages.add(filename);
    card.classList.add('selected');
  }
  updateSelectedImageCount();
  updateApiUrl();
}

// 更新选中图片数量
function updateSelectedImageCount() {
  document.getElementById('selectedImageCount').textContent = apiSelectedImages.size;
}

// 清除选择
function clearSelectedApiImages() {
  apiSelectedImages.clear();
  document.querySelectorAll('.selector-image-card').forEach(card => {
    card.classList.remove('selected');
  });
  updateSelectedImageCount();
  updateApiUrl();
}

// 图片来源变化处理
function onImageSourceChange() {
  const imageSource = document.getElementById('imageSource').value;
  const imageSelector = document.getElementById('imageSelector');
  
  if (imageSource === 'selected') {
    imageSelector.style.display = 'block';
  } else {
    imageSelector.style.display = 'none';
  }
  
  updateApiUrl();
}

// API类型变化处理
function onApiTypeChange() {
  const apiType = document.getElementById('apiType').value;
  const countRow = document.getElementById('countRow');
  
  if (apiType === 'list') {
    countRow.style.display = 'flex';
  } else {
    countRow.style.display = 'none';
  }
  
  updateApiUrl();
}

// 更新快速API链接
function updateQuickApiUrl() {
  const baseUrl = window.location.origin;
  document.getElementById('quickApiUrl').textContent = `${baseUrl}/api/random`;
}

// 复制快速链接
function copyQuickUrl() {
  const url = document.getElementById('quickApiUrl').textContent;
  copyToClipboard(url, 'API链接已复制到剪贴板');
}

// 更新API链接
function updateApiUrl() {
  const apiType = document.getElementById('apiType').value;
  const count = document.getElementById('apiCount').value;
  const category = document.getElementById('apiCategory').value;
  const imageSource = document.getElementById('imageSource').value;
  
  const baseUrl = window.location.origin;
  let apiUrl = '';
  
  switch (apiType) {
    case 'redirect':
      apiUrl = `${baseUrl}/api/random`;
      break;
    case 'json':
      apiUrl = `${baseUrl}/api/random/json`;
      break;
    case 'list':
      apiUrl = `${baseUrl}/api/random/list?count=${count}`;
      break;
  }
  
  const params = [];
  
  if (imageSource === 'selected' && apiSelectedImages.size > 0) {
    // 对每张图片文件名单独编码，然后用逗号连接（逗号不编码）
    const encodedImages = Array.from(apiSelectedImages).map(img => encodeURIComponent(img)).join(',');
    params.push(`images=${encodedImages}`);
  } else if (category) {
    params.push(`category=${category}`);
  }
  
  if (params.length > 0) {
    apiUrl += (apiUrl.includes('?') ? '&' : '?') + params.join('&');
  }
  
  document.getElementById('apiUrl').value = apiUrl;
}

// 复制API链接
function copyApiUrl() {
  const apiUrl = document.getElementById('apiUrl').value;
  copyToClipboard(apiUrl, 'API链接已复制到剪贴板');
}

// 自动刷新变化处理
function onAutoRefreshChange() {
  const interval = parseInt(document.getElementById('autoRefreshInterval').value);
  
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  
  if (interval > 0) {
    autoRefreshTimer = setInterval(previewApi, interval * 1000);
    showToast(`已开启自动刷新（每${interval}秒）`, 'success');
  }
}

// 预览API效果
async function previewApi() {
  const previewImage = document.getElementById('previewImage');
  const previewContainer = document.getElementById('previewContainer');
  const imageSource = document.getElementById('imageSource').value;
  
  previewImage.classList.remove('loaded');
  previewContainer.classList.remove('has-image');
  
  try {
    let url;
    const category = document.getElementById('apiCategory').value;
    
    if (imageSource === 'selected' && apiSelectedImages.size > 0) {
      // 从选中的图片中随机选择一张
      const images = Array.from(apiSelectedImages);
      const randomImage = images[Math.floor(Math.random() * images.length)];
      // 直接指向图片文件，并添加时间戳防止缓存
      url = `/uploads/${randomImage}?_t=${Date.now()}`;
    } else {
      url = `/api/random`;
      if (category) url += `?category=${category}`;
      // 添加时间戳防止缓存
      url += (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
    }
    
    previewImage.onload = function() {
      previewImage.classList.add('loaded');
      previewContainer.classList.add('has-image');
    };
    
    previewImage.src = url;
  } catch (error) {
    console.error('预览失败:', error);
  }
}

// ============ API配置管理功能 ============

// 默认API配置
const DEFAULT_API_CONFIG = {
  apiType: 'redirect',
  count: '5',
  category: '',
  imageSource: 'random',
  selectedImages: []
};

// 是否已加载配置的标志
let apiConfigLoaded = false;

// 保存API配置
function saveApiConfig() {
  try {
    const config = {
      apiType: document.getElementById('apiType').value,
      count: document.getElementById('apiCount').value,
      category: document.getElementById('apiCategory').value,
      imageSource: document.getElementById('imageSource').value,
      selectedImages: Array.from(apiSelectedImages)
    };
    
    localStorage.setItem('apiConfig', JSON.stringify(config));
    showToast('API配置已保存', 'success');
  } catch (error) {
    console.error('保存API配置失败:', error);
    showToast('保存配置失败', 'error');
  }
}

// 加载API配置
function loadApiConfig(forceReload = false) {
  try {
    if (!forceReload && apiConfigLoaded) {
      return;
    }
    
    const savedConfig = localStorage.getItem('apiConfig');
    if (!savedConfig) {
      return;
    }
    
    const config = JSON.parse(savedConfig);
    
    // 应用配置
    document.getElementById('apiType').value = config.apiType || DEFAULT_API_CONFIG.apiType;
    document.getElementById('apiCount').value = config.count || DEFAULT_API_CONFIG.count;
    document.getElementById('apiCategory').value = config.category || DEFAULT_API_CONFIG.category;
    document.getElementById('imageSource').value = config.imageSource || DEFAULT_API_CONFIG.imageSource;
    
    // 恢复选中的图片
    if (config.selectedImages && config.selectedImages.length > 0) {
      apiSelectedImages = new Set(config.selectedImages);
      updateSelectedImageCount();
    }
    
    // 更新UI状态
    onApiTypeChange();
    onImageSourceChange();
    
    // 更新选中的图片卡片显示
    if (config.selectedImages && config.selectedImages.length > 0) {
      document.querySelectorAll('.selector-image-card').forEach(card => {
        const filename = card.dataset.filename;
        if (apiSelectedImages.has(filename)) {
          card.classList.add('selected');
        }
      });
    }
    
    updateApiUrl();
    apiConfigLoaded = true;
  } catch (error) {
    console.error('加载API配置失败:', error);
  }
}

// 重置API配置
function resetApiConfig() {
  try {
    // 恢复默认值
    document.getElementById('apiType').value = DEFAULT_API_CONFIG.apiType;
    document.getElementById('apiCount').value = DEFAULT_API_CONFIG.count;
    document.getElementById('apiCategory').value = DEFAULT_API_CONFIG.category;
    document.getElementById('imageSource').value = DEFAULT_API_CONFIG.imageSource;
    
    // 清除选中的图片
    apiSelectedImages.clear();
    document.querySelectorAll('.selector-image-card').forEach(card => {
      card.classList.remove('selected');
    });
    updateSelectedImageCount();
    
    // 更新UI状态
    onApiTypeChange();
    onImageSourceChange();
    updateApiUrl();
    
    // 清除保存的配置
    localStorage.removeItem('apiConfig');
    apiConfigLoaded = false;
    
    showToast('已恢复默认配置', 'success');
  } catch (error) {
    console.error('重置API配置失败:', error);
    showToast('重置配置失败', 'error');
  }
}

// ============ 分组管理功能 ============

// 加载分组列表
async function loadGroups() {
  try {
    const [categoriesRes, imagesRes] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/images')
    ]);
    
    const categoriesData = await categoriesRes.json();
    const imagesData = await imagesRes.json();
    
    if (categoriesData.success) {
      allGroups = categoriesData.categories || [];
      // 获取真实的图片总数并保存到全局变量
      totalImagesCount = imagesData.success && imagesData.images ? imagesData.images.length : 0;
      renderGroupTabs();
      renderGroupFilter();
    }
  } catch (error) {
    console.error('加载分组失败:', error);
  }
}

// 加载分组列表用于上传
async function loadGroupsForUpload() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    
    if (data.success) {
      allGroups = data.categories || [];
      const select = document.getElementById('uploadGroup');
      select.innerHTML = '<option value="">默认分组</option>';
      allGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('加载分组失败:', error);
  }
}

// 渲染分组标签
function renderGroupTabs() {
  const tabsContainer = document.getElementById('groupTabs');
  // 使用全局变量中存储的真实图片总数
  
  let html = `<div class="group-tab ${currentGroupFilter === '' ? 'active' : ''}" onclick="filterByGroupTab('')">
    全部
    <span class="group-count">${totalImagesCount}</span>
  </div>`;
  
  allGroups.forEach(group => {
    html += `<div class="group-tab ${currentGroupFilter === group.id ? 'active' : ''}" onclick="filterByGroupTab('${group.id}')">
      ${group.name}
      <span class="group-count">${group.images.length}</span>
      <button class="delete-group-btn" onclick="event.stopPropagation(); deleteGroup('${group.id}')" title="删除分组">×</button>
    </div>`;
  });
  
  tabsContainer.innerHTML = html;
}

// 通过标签筛选分组
function filterByGroupTab(groupId) {
  currentGroupFilter = groupId;
  renderGroupTabs();
  loadImages();
}

// 通过下拉框筛选分组
function filterByGroup() {
  currentGroupFilter = document.getElementById('galleryGroupFilter').value;
  renderGroupTabs();
  loadImages();
}

// 渲染分组筛选下拉框
function renderGroupFilter() {
  const select = document.getElementById('galleryGroupFilter');
  if (!select) return;
  
  // 使用全局变量中存储的真实图片总数
  select.innerHTML = `<option value="">全部 (${totalImagesCount})</option>`;
  allGroups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = `${group.name} (${group.images.length})`;
    if (currentGroupFilter === group.id) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// 显示创建分组弹窗
function showCreateGroupModal() {
  document.getElementById('createGroupModal').classList.add('show');
  document.getElementById('newGroupName').value = '';
}

// 关闭创建分组弹窗
function closeCreateGroupModal() {
  document.getElementById('createGroupModal').classList.remove('show');
}

// 创建分组
async function createGroup(e) {
  e.preventDefault();
  const name = document.getElementById('newGroupName').value.trim();
  
  if (!name) {
    showToast('请输入分组名称', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('分组创建成功', 'success');
      closeCreateGroupModal();
      loadGroups();
      loadGroupsForUpload();
    } else {
      showToast(data.error || '创建失败', 'error');
    }
  } catch (error) {
    showToast('创建失败', 'error');
  }
}

// 删除分组
let pendingDeleteGroupId = null;

async function deleteGroup(groupId) {
  const group = allGroups.find(g => g.id === groupId);
  if (!group) return;
  
  pendingDeleteGroupId = groupId;
  document.getElementById('deleteGroupName').textContent = group.name;
  document.getElementById('deleteGroupImageCount').textContent = group.images.length;
  
  const radios = document.querySelectorAll('input[name="deleteGroupAction"]');
  radios.forEach(radio => {
    radio.checked = radio.value === 'move';
  });
  
  document.getElementById('deleteGroupModal').classList.add('show');
}

function closeDeleteGroupModal() {
  document.getElementById('deleteGroupModal').classList.remove('show');
  pendingDeleteGroupId = null;
}

async function confirmDeleteGroup() {
  if (!pendingDeleteGroupId) return;
  
  const action = document.querySelector('input[name="deleteGroupAction"]:checked').value;
  
  try {
    const response = await fetch(`/api/categories/${pendingDeleteGroupId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('分组已删除', 'success');
      if (currentGroupFilter === pendingDeleteGroupId) {
        currentGroupFilter = '';
      }
      closeDeleteGroupModal();
      loadGroups();
      loadImages();
    } else {
      showToast(data.error || '删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// 更新移动到分组下拉框
function updateMoveToGroupSelect() {
  const select = document.getElementById('moveToGroupSelect');
  select.innerHTML = '<option value="">移动到分组...</option><option value="_none_">移出分组</option>';
  allGroups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    select.appendChild(option);
  });
}

// 移动选中的图片到指定分组
async function moveSelectedToGroup() {
  if (selectedImages.size === 0) {
    showToast('请先选择图片', 'error');
    return;
  }
  
  const targetGroupId = document.getElementById('moveToGroupSelect').value;
  
  if (!targetGroupId) {
    showToast('请选择目标分组', 'error');
    return;
  }
  
  const filenames = Array.from(selectedImages);
  const targetGroupName = targetGroupId === '_none_' ? '默认分组' : 
    (allGroups.find(g => g.id === targetGroupId)?.name || '未知分组');
  
  try {
    const response = await fetch('/api/images/move-to-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filenames,
        categoryId: targetGroupId === '_none_' ? null : targetGroupId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(`已将 ${filenames.length} 张图片移动到"${targetGroupName}"`, 'success');
      selectedImages.clear();
      updateSelectedCount();
      loadGroups();
      loadImages();
    } else {
      showToast(data.error || '移动失败', 'error');
    }
  } catch (error) {
    showToast('移动失败', 'error');
  }
}

// ============ 公共图片功能 ============

// 加载必应壁纸
async function loadBingWallpapers() {
  const grid = document.getElementById('wallpapersGrid');
  
  grid.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  `;
  
  try {
    const response = await fetch('/api/bing-wallpapers');
    const data = await response.json();
    
    if (data.success) {
      renderWallpapers(data.wallpapers);
      showToast('壁纸已刷新（每日更新一次）', 'success');
    } else {
      grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">${data.error || '加载失败'}</p>`;
    }
  } catch (error) {
    console.error('加载必应壁纸失败:', error);
    grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">网络错误，请稍后重试</p>';
  }
}

// 渲染壁纸列表
function renderWallpapers(wallpapers) {
  const grid = document.getElementById('wallpapersGrid');
  bingWallpaperList = wallpapers;
  
  if (wallpapers.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">暂无壁纸</p>';
    return;
  }
  
  grid.innerHTML = wallpapers.map((wallpaper, index) => `
    <div class="wallpaper-card">
      <img class="wallpaper-image" src="${wallpaper.thumbnail}" alt="${wallpaper.title}" onclick="openWallpaperModal('${wallpaper.url}', ${index})">
      <div class="wallpaper-info">
        <div class="wallpaper-title">${wallpaper.title || '必应壁纸'}</div>
        <div class="wallpaper-copyright">${wallpaper.copyright || ''}</div>
        <div class="wallpaper-actions">
          <button class="wallpaper-btn btn-download" onclick="openWallpaperModal('${wallpaper.url}', ${index})">
            👁️ 全屏预览
          </button>
          <button class="wallpaper-btn btn-save" onclick="saveWallpaperToLibrary('${wallpaper.url}')">
            💾 转存到我的图库
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// 打开壁纸预览
function openWallpaperModal(url, index = 0) {
  isPreviewingBingWallpapers = true;
  currentImageIndex = index;
  currentZoom = 1;
  modalImageContainer = document.getElementById('modalImageContainer');
  updateModalImage(url);
  imageModal.classList.add('show');
}

// 保存壁纸到图片库
async function saveWallpaperToLibrary(wallpaperUrl) {
  try {
    const response = await fetch('/api/bing-wallpapers/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ wallpaperUrl })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('壁纸已保存到公共图片分组', 'success');
    } else {
      showToast(data.error || '保存失败', 'error');
    }
  } catch (error) {
    console.error('保存壁纸失败:', error);
    showToast('保存失败，请稍后重试', 'error');
  }
}

// 加载登录页面背景
async function loadLoginBackground() {
  try {
    const response = await fetch('/api/bing-wallpapers/login');
    const data = await response.json();
    
    if (data.success && data.wallpaper) {
      const bgElement = document.getElementById('loginBackground');
      bgElement.style.backgroundImage = `url('${data.wallpaper.url}')`;
      bgElement.classList.add('loaded');
    }
  } catch (error) {
    console.error('加载登录背景失败:', error);
  }
  
  try {
    const quoteResponse = await fetch('/api/daily-quote');
    const quoteData = await quoteResponse.json();
    
    if (quoteData.success && quoteData.quote) {
      document.getElementById('quoteText').textContent = quoteData.quote.text;
      document.getElementById('quoteAuthor').textContent = quoteData.quote.author;
    }
  } catch (error) {
    console.error('加载每日一言失败:', error);
  }
}

