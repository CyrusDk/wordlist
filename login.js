document.getElementById('loginForm').addEventListener('submit', checklogin);

function checklogin(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const errorDiv = document.getElementById('loginError');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // 清除旧状态
    errorDiv.textContent = '';
    submitBtn.disabled = true;
    
    // 输入验证
    if (!username || !password) {
        showError(errorDiv, '用户名和密码不能为空');
        submitBtn.disabled = false;
        return;
    }
    
    if (password.length < 6) {
        showError(errorDiv, '密码长度不能少于6位');
        submitBtn.disabled = false;
        return;
    }
    
    // 显示加载状态
    const loader = createLoader();
    submitBtn.appendChild(loader);
    
    // 模拟API请求
    setTimeout(() => {
        loader.remove();
        submitBtn.disabled = false;
        
        // 登录逻辑
        if (username === "admin" && password === "123456") {
            window.location.href = '主页.html';
        } else {
            showError(errorDiv, '用户名或密码错误');
            form.password.value = '';
            form.password.focus();
        }
    }, 1500);
}

function createLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="spinner"></div>
        <span>登录中...</span>
    `;
    return loader;
}

function showError(container, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
        <span>⚠️</span>
        <p>${message}</p>
    `;
    container.appendChild(errorEl);
    
    // 自动消失
    setTimeout(() => {
        errorEl.style.opacity = '0';
        setTimeout(() => errorEl.remove(), 500);
    }, 3000);
}

// 添加输入框即时验证
document.getElementById('username').addEventListener('input', clearError);
document.getElementById('password').addEventListener('input', clearError);

function clearError() {
    document.getElementById('loginError').textContent = '';
}
