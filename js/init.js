// تهيئة وضع التطوير
window.isDevMode = function() { return true; };

// تهيئة بيانات المستخدمين الافتراضية
document.addEventListener('DOMContentLoaded', function() {
  console.log('تهيئة وضع التطوير...');
  
  // إضافة مستمعي الأحداث لنموذج تسجيل الدخول
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // التحقق من بيانات تسجيل الدخول
      if ((username === 'admin' && password === 'admin123') || 
          (username === 'user' && password === 'user123')) {
        
        // حفظ بيانات المستخدم في التخزين المحلي
        const user = {
          id: username,
          username: username,
          name: username === 'admin' ? 'مدير النظام' : 'مستخدم عادي',
          role: username === 'admin' ? 'admin' : 'user'
        };
        
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('operations', '[]');
        localStorage.setItem('devModeInitialized', 'true');
        
        // توجيه المستخدم إلى الصفحة المناسبة
        if (username === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'user.html';
        }
      } else {
        // عرض رسالة خطأ
        const loginError = document.getElementById('login-error');
        if (loginError) {
          loginError.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
          loginError.style.display = 'block';
          
          setTimeout(() => {
            loginError.style.display = 'none';
          }, 5000);
        }
      }
    });
  }
});
