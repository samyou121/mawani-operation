// عمليات المواني - ملف المصادقة
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('login-error');
    const apiUrl = 'https://api.operations-app.com'; // سيتم تغييره لاحقاً للرابط الفعلي للواجهة الخلفية

    // التحقق من وجود جلسة مسجلة
    checkAuthStatus();

    // معالجة نموذج تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showError('يرجى إدخال اسم المستخدم وكلمة المرور');
                return;
            }
            
            try {
                // في الوضع التجريبي، نستخدم بيانات ثابتة للمصادقة
                if (isDevMode()) {
                    handleDevLogin(username, password);
                    return;
                }
                
                // في الوضع الإنتاجي، نتصل بالواجهة الخلفية
                const response = await fetch(`${apiUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'فشل تسجيل الدخول');
                }
                
                // حفظ بيانات المصادقة في التخزين المحلي
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // توجيه المستخدم إلى الصفحة المناسبة
                redirectBasedOnRole(data.user.role);
                
            } catch (error) {
                showError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
                console.error('Login error:', error);
            }
        });
    }
    
    // التحقق من حالة المصادقة
    function checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (token && user.username) {
            // إذا كان المستخدم على صفحة تسجيل الدخول، قم بتوجيهه إلى الصفحة المناسبة
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                redirectBasedOnRole(user.role);
            }
        } else {
            // إذا كان المستخدم على صفحة محمية ولم يسجل الدخول، قم بتوجيهه إلى صفحة تسجيل الدخول
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/';
            }
        }
    }
    
    // توجيه المستخدم بناءً على دوره
    function redirectBasedOnRole(role) {
        if (role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/user.html';
        }
    }
    
    // عرض رسالة خطأ
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        // إخفاء رسالة الخطأ بعد 5 ثوانٍ
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 5000);
    }
    
    // التحقق مما إذا كان التطبيق في وضع التطوير
    function isDevMode() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    
    // معالجة تسجيل الدخول في وضع التطوير
    function handleDevLogin(username, password) {
        // بيانات المستخدمين الافتراضية للتطوير
        const devUsers = [
            { username: 'admin', password: 'admin123', role: 'admin', name: 'مدير النظام' },
            { username: 'user', password: 'user123', role: 'user', name: 'مستخدم عادي' }
        ];
        
        const user = devUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            // حفظ بيانات المستخدم في التخزين المحلي
            localStorage.setItem('token', 'dev-token');
            localStorage.setItem('user', JSON.stringify({
                id: user.username,
                username: user.username,
                name: user.name,
                role: user.role
            }));
            
            // توجيه المستخدم إلى الصفحة المناسبة
            redirectBasedOnRole(user.role);
        } else {
            showError('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    }
    
    // تسجيل الخروج
    window.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };
});
