// 全局变量
let selectMode = false;
let selectedImages = new Set();
let uploadMode = 'select';
let currentPage = 'gallery';
let currentGroupFilter = 'all';
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
const galleryProgressContainer = document.getElementById('galleryProgressContainer');
const galleryProgressFill = document.getElementById('galleryProgressFill');
const galleryProgressText = document.getElementById('galleryProgressText');
const batchSelectBtn = document.getElementById('batchSelectBtn');
const batchActions = document.getElementById('batchActions');

// 初始化
checkAuth();
loadTheme();
loadSiteSettings();
loadLoginBackground();

// 检查上传状态
checkUploadState();

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
    uploadFiles(files);
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

  const batchSize = 100; // 每批100张，更高效
  const totalFiles = files.length;
  const totalBatches = Math.ceil(totalFiles / batchSize);
  
  // 在开始上传时就确定分组ID，确保所有批次使用同一个分组
  let groupId = document.getElementById('uploadGroup')?.value || 'home';
  if (!groupId) groupId = 'home';
  
  if (totalBatches > 1) {
    showToast(`共 ${totalFiles} 张图片，将分 ${totalBatches} 批上传到 ${groupId === 'home' ? '默认' : '选中'} 分组`, 'success');
  }

  let uploadedCount = 0;
  let failedBatches = 0;
  
  // 存储上传状态到本地存储，防止刷新页面后丢失
  const uploadState = {
    totalFiles,
    totalBatches,
    groupId,
    currentBatch: 0,
    uploadedCount: 0,
    failedBatches: 0
  };
  localStorage.setItem('uploadState', JSON.stringify(uploadState));
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalFiles);
    const batch = files.slice(start, end);
    
    // 更新上传状态
    uploadState.currentBatch = i + 1;
    localStorage.setItem('uploadState', JSON.stringify(uploadState));
    
    try {
      await uploadBatch(batch, i + 1, totalBatches, totalFiles, uploadedCount, groupId);
      uploadedCount += batch.length;
      uploadState.uploadedCount = uploadedCount;
      localStorage.setItem('uploadState', JSON.stringify(uploadState));
    } catch (error) {
      failedBatches++;
      uploadState.failedBatches = failedBatches;
      localStorage.setItem('uploadState', JSON.stringify(uploadState));
      console.error(`第 ${i + 1} 批上传失败:`, error);
    }
  }
  
  // 上传完成后清除上传状态
  localStorage.removeItem('uploadState');
  
  if (failedBatches === 0) {
    showToast(`全部上传完成！共上传 ${uploadedCount} 张图片到 ${groupId === 'home' ? '默认' : '选中'} 分组`, 'success');
  } else {
    showToast(`上传完成！成功 ${uploadedCount} 张，失败 ${totalFiles - uploadedCount} 张`, 'warning');
  }
  
  await loadGroups(); // 刷新分组数量
  switchPage('gallery');
}

// 上传单个批次
async function uploadBatch(files, batchNum, totalBatches, totalFiles, uploadedCount, groupId) {
  if (files.length === 0) return;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  
  if (totalBatches > 1) {
    progressText.textContent = `准备上传第 ${batchNum}/${totalBatches} 批 (${files.length} 张)`;
  } else {
    progressText.textContent = `准备上传 ${files.length} 张图片 (${totalSizeMB}MB)...`;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }
  
  // 使用传入的 groupId，确保所有批次使用同一个分组
  formData.append('groupId', groupId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && totalBatches > 1) {
        const batchPercent = (e.loaded / e.total) * 100;
        const overallPercent = ((batchNum - 1) / totalBatches) * 100 + (batchPercent / totalBatches);
        progressFill.style.width = overallPercent + '%';
        progressText.textContent = `上传第 ${batchNum}/${totalBatches} 批 (${Math.round(batchPercent)}%) - ${uploadedCount + Math.round((e.loaded / e.total) * files.length)}/${totalFiles} 张`;
      } else if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressFill.style.width = percent + '%';
        progressText.textContent = `上传中 ${Math.round(percent)}% (${Math.round((e.loaded / e.total) * files.length)}/${files.length} 张)`;
      }
    });

    xhr.addEventListener('load', () => {
      progressContainer.style.display = 'none';

      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        showToast(`第 ${batchNum}/${totalBatches} 批上传成功 ${result.images.length} 张图片`, 'success');
        resolve();
      } else if (xhr.status === 401) {
        showToast('请先登录', 'error');
        checkAuth();
        reject(new Error('未登录'));
      } else {
        const error = JSON.parse(xhr.responseText);
        showToast(`第 ${batchNum}/${totalBatches} 批上传失败: ${error.error || '上传失败'}`, 'error');
        reject(new Error(error.error || '上传失败'));
      }
    });

    xhr.addEventListener('error', () => {
      progressContainer.style.display = 'none';
      showToast(`第 ${batchNum}/${totalBatches} 批上传失败：网络错误`, 'error');
      reject(new Error('网络错误'));
    });

    xhr.open('POST', '/api/upload/multiple');
    xhr.send(formData);
  });
}

// 加载图片
async function loadImages() {
  try {
    let url = '/api/images/all';
    if (currentGroupFilter && currentGroupFilter !== 'all') {
      url = `/api/categories/${currentGroupFilter}/images`;
    }
    
    const response = await fetch(url + '?t=' + Date.now());
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
    // 显示删除进度
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = `准备删除图片...`;
    
    // 模拟进度更新
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        progressFill.style.width = progress + '%';
        progressText.textContent = `删除中 ${progress}%...`;
      }
    }, 100);
    
    const response = await fetch(`/api/images/${filename}`, { method: 'DELETE' });
    
    // 清除进度更新
    clearInterval(progressInterval);
    
    // 更新进度
    progressFill.style.width = '100%';
    progressText.textContent = `删除完成`;
    
    if (response.status === 401) { 
      progressContainer.style.display = 'none';
      checkAuth(); 
      return; 
    }
    
    const data = await response.json();
    progressContainer.style.display = 'none';
    
    if (data.success) {
      showToast('删除成功', 'success');
      await loadGroups(); // 刷新分组数量
      await loadImages(); // 刷新图片列表
    } else {
      showToast(data.error || '删除失败', 'error');
    }
  } catch (error) {
    progressContainer.style.display = 'none';
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
    const filenames = Array.from(selectedImages);
    const total = filenames.length;
    let completed = 0;
    let successCount = 0;
    let failedFilenames = [];
    
    // 显示删除进度
    galleryProgressContainer.style.display = 'block';
    galleryProgressFill.style.width = '0%';
    galleryProgressText.textContent = `准备删除 ${total} 张图片...`;
    
    // 重试函数
    async function deleteWithRetry(filename, maxRetries = 5) {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          const response = await fetch(`/api/images/${filename}`, { 
            method: 'DELETE',
            timeout: 20000 // 20秒超时
          });
          const data = await response.json();
          return data.success;
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            console.error(`删除图片 ${filename} 失败:`, error);
            return false;
          }
          // 等待一段时间后重试，递增等待时间
          await new Promise(resolve => setTimeout(resolve, 1500 * retries));
        }
      }
    }
    
    // 串行删除，确保每个请求都能完成
    for (let i = 0; i < total; i++) {
      const filename = filenames[i];
      try {
        const success = await deleteWithRetry(filename);
        completed++;
        const percent = (completed / total) * 100;
        galleryProgressFill.style.width = percent + '%';
        galleryProgressText.textContent = `删除中 ${Math.round(percent)}% (${completed}/${total} 张)`;
        if (success) {
          successCount++;
        } else {
          failedFilenames.push(filename);
        }
        // 每删除一张图片，等待200毫秒，给服务器一点休息时间
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        completed++;
        const percent = (completed / total) * 100;
        galleryProgressFill.style.width = percent + '%';
        galleryProgressText.textContent = `删除中 ${Math.round(percent)}% (${completed}/${total} 张)`;
        console.error(`删除图片 ${filename} 失败:`, error);
        failedFilenames.push(filename);
        // 出错后也等待200毫秒
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // 尝试删除失败的图片
    if (failedFilenames.length > 0) {
      galleryProgressText.textContent = `尝试重新删除失败的 ${failedFilenames.length} 张图片...`;
      
      let retrySuccessCount = 0;
      for (const filename of failedFilenames) {
        try {
          const success = await deleteWithRetry(filename, 3); // 再重试3次
          if (success) {
            retrySuccessCount++;
          }
          // 每重试一张图片，等待300毫秒
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`重新删除图片 ${filename} 失败:`, error);
        }
      }
      
      successCount += retrySuccessCount;
      failedFilenames = failedFilenames.slice(retrySuccessCount);
    }
    
    galleryProgressContainer.style.display = 'none';
    
    if (failedFilenames.length === 0) {
      showToast(`成功删除全部 ${successCount} 张图片`, 'success');
    } else {
      showToast(`成功删除 ${successCount} 张图片，失败 ${failedFilenames.length} 张`, 'warning');
      console.log('删除失败的图片:', failedFilenames);
    }
    
    selectedImages.clear();
    updateSelectedCount();
    await loadGroups(); // 刷新分组数量
    await loadImages(); // 刷新图片列表
  } catch (error) {
    galleryProgressContainer.style.display = 'none';
    showToast('删除失败', 'error');
    console.error('批量删除失败:', error);
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
  // 直接设置内联样式显示模态框
  imageModal.style.display = 'flex';
  imageModal.classList.add('show');
  // 初始化工具栏控制
  if (window.initToolbarControls) {
    setTimeout(() => {
      window.initToolbarControls();
    }, 100);
  }
}

function updateModalImage(url) {
  const modalImage = document.getElementById('modalImage');
  const downloadBtn = document.getElementById('downloadBtn').querySelector('a');
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
  // 直接设置内联样式隐藏模态框
  imageModal.style.display = 'none';
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

// 工具栏显示/隐藏控制
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('imageModal');
  const modalControls = document.querySelector('.modal-controls');
  const modalClose = document.querySelector('.modal-close');
  const modalCloseCenter = document.querySelector('.modal-close-center');
  const toolbarHint = document.getElementById('toolbarHint');
  
  // 配置参数
  const CONFIG = {
    hideDelay: 2500,        // 隐藏延迟时间（毫秒）
    transitionDuration: 300, // 过渡动画持续时间（毫秒）
    hintOpacity: 0.5        // 提示条透明度
  };
  
  let hideTimeout = null;
  let isControlsVisible = false;
  
  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 显示工具栏和关闭按钮
  function showControls() {
    clearTimeout(hideTimeout);
    
    if (!isControlsVisible) {
      isControlsVisible = true;
      
      // 显示工具栏
      modalControls.style.opacity = '1';
      modalControls.style.transform = 'translateX(-50%) translateY(0)';
      modalControls.style.pointerEvents = 'auto';
      
      // 显示右上角关闭按钮
      modalClose.style.opacity = '1';
      modalClose.style.pointerEvents = 'auto';
      
      // 显示中央关闭按钮
      if (modalCloseCenter) {
        modalCloseCenter.style.opacity = '1';
        modalCloseCenter.style.pointerEvents = 'auto';
      }
      
      // 隐藏提示条
      if (toolbarHint) {
        toolbarHint.style.opacity = '0';
      }
    }
    
    // 重新启动隐藏计时器
    startHideTimer();
  }
  
  // 隐藏工具栏和关闭按钮
  function hideControls() {
    isControlsVisible = false;
    
    // 隐藏工具栏
    modalControls.style.opacity = '0';
    modalControls.style.transform = 'translateX(-50%) translateY(20px)';
    modalControls.style.pointerEvents = 'none';
    
    // 隐藏右上角关闭按钮
    modalClose.style.opacity = '0';
    modalClose.style.pointerEvents = 'none';
    
    // 隐藏中央关闭按钮
    if (modalCloseCenter) {
      modalCloseCenter.style.opacity = '0';
      modalCloseCenter.style.pointerEvents = 'none';
    }
    
    // 显示提示条
    if (toolbarHint) {
      toolbarHint.style.opacity = CONFIG.hintOpacity;
    }
  }
  
  // 启动隐藏计时器
  function startHideTimer() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      hideControls();
    }, CONFIG.hideDelay);
  }
  
  // 初始化工具栏状态
  function initControls() {
    // 初始状态：隐藏工具栏，显示提示条
    modalControls.style.opacity = '0';
    modalControls.style.transform = 'translateX(-50%) translateY(20px)';
    modalControls.style.pointerEvents = 'none';
    modalControls.style.transition = `all ${CONFIG.transitionDuration}ms ease`;
    
    // 初始化右上角关闭按钮
    modalClose.style.opacity = '0';
    modalClose.style.pointerEvents = 'none';
    modalClose.style.transition = `all ${CONFIG.transitionDuration}ms ease`;
    
    // 初始化中央关闭按钮
    if (modalCloseCenter) {
      modalCloseCenter.style.opacity = '0';
      modalCloseCenter.style.pointerEvents = 'none';
      modalCloseCenter.style.transition = `all ${CONFIG.transitionDuration}ms ease`;
    }
    
    if (toolbarHint) {
      toolbarHint.style.opacity = CONFIG.hintOpacity;
      toolbarHint.style.transition = `opacity ${CONFIG.transitionDuration}ms ease`;
    }
    
    isControlsVisible = false;
  }
  
  // 鼠标移动事件处理（使用防抖）
  const handleMouseMove = debounce(() => {
    showControls();
  }, 50);
  
  // 监听鼠标移动
  modal.addEventListener('mousemove', handleMouseMove);
  
  // 监听鼠标进入模态框
  modal.addEventListener('mouseenter', () => {
    showControls();
  });
  
  // 监听提示条点击
  if (toolbarHint) {
    toolbarHint.addEventListener('click', (e) => {
      e.stopPropagation();
      showControls();
    });
    
    toolbarHint.addEventListener('mouseenter', () => {
      toolbarHint.style.opacity = '0.8';
    });
    
    toolbarHint.addEventListener('mouseleave', () => {
      if (!isControlsVisible) {
        toolbarHint.style.opacity = CONFIG.hintOpacity;
      }
    });
  }
  
  // 监听工具栏鼠标事件，防止隐藏
  modalControls.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });
  
  modalControls.addEventListener('mouseleave', () => {
    startHideTimer();
  });
  
  // 监听右上角关闭按钮鼠标事件
  modalClose.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });
  
  modalClose.addEventListener('mouseleave', () => {
    startHideTimer();
  });
  
  // 监听中央关闭按钮鼠标事件
  if (modalCloseCenter) {
    modalCloseCenter.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      // 悬停时增加背景透明度
      modalCloseCenter.style.background = 'rgba(255, 255, 255, 0.3)';
      modalCloseCenter.style.transform = 'translateX(-50%) scale(1.1)';
    });
    
    modalCloseCenter.addEventListener('mouseleave', () => {
      startHideTimer();
      // 恢复背景透明度
      modalCloseCenter.style.background = 'rgba(255, 255, 255, 0.15)';
      modalCloseCenter.style.transform = 'translateX(-50%) scale(1)';
    });
    
    // 点击时阻止事件冒泡
    modalCloseCenter.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      initControls();
    }, 100);
  });
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    // 保持当前状态，只调整位置
    if (isControlsVisible) {
      showControls();
    } else {
      hideControls();
    }
  });
  
  // 暴露初始化函数供外部调用
  window.initToolbarControls = initControls;
  window.showToolbarControls = showControls;
  window.hideToolbarControls = hideControls;
  
  // 初始化
  initControls();
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

// 检查上传状态
function checkUploadState() {
  const uploadState = localStorage.getItem('uploadState');
  if (uploadState) {
    try {
      const state = JSON.parse(uploadState);
      if (state.currentBatch > 0 && state.currentBatch < state.totalBatches) {
        if (confirm(`检测到有未完成的上传任务：共 ${state.totalFiles} 张图片，已上传 ${state.uploadedCount} 张，当前正在上传第 ${state.currentBatch} 批。是否继续上传？`)) {
          // 这里可以添加继续上传的逻辑
          // 由于文件对象无法在本地存储中保存，需要用户重新选择文件
          showToast('请重新选择文件以继续上传', 'info');
        } else {
          // 清除上传状态
          localStorage.removeItem('uploadState');
        }
      } else if (state.currentBatch === state.totalBatches && state.uploadedCount < state.totalFiles) {
        // 上传已完成但有失败
        showToast(`上次上传完成：成功 ${state.uploadedCount} 张，失败 ${state.totalFiles - state.uploadedCount} 张`, 'info');
        localStorage.removeItem('uploadState');
      }
    } catch (error) {
      console.error('解析上传状态失败:', error);
      localStorage.removeItem('uploadState');
    }
  }
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
    const t = Date.now();
    const [categoriesRes, allImagesRes] = await Promise.all([
      fetch('/api/categories?t=' + t),
      fetch('/api/images/all?t=' + t)
    ]);
    
    const categoriesData = await categoriesRes.json();
    const allImagesData = await allImagesRes.json();
    
    if (categoriesData.success) {
      allGroups = categoriesData.categories || [];
      // 所有图片的总数
      totalImagesCount = allImagesData.success && allImagesData.images ? allImagesData.images.length : 0;
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
      select.innerHTML = '';
      allGroups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (group.id === 'home') {
          option.selected = true;
        }
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
  
  // "所有"分组显示全部图片
  let html = `<div class="group-tab ${currentGroupFilter === 'all' ? 'active' : ''}" onclick="filterByGroupTab('all')">
    所有
    <span class="group-count">${totalImagesCount}</span>
  </div>`;
  
  allGroups.forEach(group => {
    const isHome = group.id === 'home';
    html += `<div class="group-tab ${currentGroupFilter === group.id ? 'active' : ''}" onclick="filterByGroupTab('${group.id}')">
      ${group.name}
      <span class="group-count">${group.images.length}</span>
      ${!isHome ? `<div class="group-actions">
        <button class="rename-group-btn" onclick="event.stopPropagation(); showRenameGroupModal('${group.id}', '${group.name.replace(/'/g, "\\'")}')" title="重命名">✏️</button>
        <button class="delete-group-btn" onclick="event.stopPropagation(); deleteGroup('${group.id}')" title="删除分组">×</button>
      </div>` : ''}
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
  
  let html = `<option value="all">所有 (${totalImagesCount})</option>`;
  select.innerHTML = html;
  
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

// 重命名分组
let pendingRenameGroupId = null;

function showRenameGroupModal(groupId, currentName) {
  pendingRenameGroupId = groupId;
  document.getElementById('renameGroupInput').value = currentName;
  document.getElementById('renameGroupModal').classList.add('show');
}

function closeRenameGroupModal() {
  document.getElementById('renameGroupModal').classList.remove('show');
  pendingRenameGroupId = null;
}

async function confirmRenameGroup() {
  if (!pendingRenameGroupId) return;
  
  const newName = document.getElementById('renameGroupInput').value.trim();
  if (!newName) {
    showToast('分组名称不能为空', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/categories/${pendingRenameGroupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    
    if (response.status === 401) { checkAuth(); return; }
    
    const data = await response.json();
    if (data.success) {
      showToast('重命名成功', 'success');
      closeRenameGroupModal();
      await loadGroups();
      await loadImages();
    } else {
      showToast(data.error || '重命名失败', 'error');
    }
  } catch (error) {
    showToast('重命名失败', 'error');
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

