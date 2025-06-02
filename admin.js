// عمليات المواني - ملف إدارة المدير
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود جلسة مسجلة وصلاحيات المدير
    checkAdminAuth();
    
    // المتغيرات العامة
    const apiUrl = 'https://api.operations-app.com'; // سيتم تغييره لاحقاً للرابط الفعلي للواجهة الخلفية
    const operationForm = document.getElementById('operationForm');
    const userForm = document.getElementById('userForm');
    const reportForm = document.getElementById('reportForm');
    const operationsMessage = document.getElementById('operationsMessage');
    const usersMessage = document.getElementById('usersMessage');
    const reportsMessage = document.getElementById('reportsMessage');
    const operationsTableBody = document.getElementById('operationsTableBody');
    const usersList = document.getElementById('usersList');
    const searchInput = document.getElementById('searchInput');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    const reportType = document.getElementById('reportType');
    const dateRangeGroup = document.getElementById('dateRangeGroup');
    const reportResults = document.getElementById('reportResults');
    const reportContent = document.getElementById('reportContent');
    const printReportBtn = document.getElementById('printReportBtn');
    
    let editingOperationId = null;
    let editingUserId = null;
    
    // تهيئة التطبيق
    initializeTabs();
    loadOperations();
    loadUsers();
    
    // إضافة مستمعي الأحداث
    if (operationForm) {
        operationForm.addEventListener('submit', handleOperationSubmit);
    }
    
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmit);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetOperationForm);
    }
    
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', resetUserForm);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (reportType) {
        reportType.addEventListener('change', handleReportTypeChange);
    }
    
    if (printReportBtn) {
        printReportBtn.addEventListener('click', printReport);
    }
    
    // التحقق من صلاحيات المدير
    function checkAdminAuth() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // عرض اسم المستخدم
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
        
        // التحقق من صلاحيات المدير
        if (!user.role || user.role !== 'admin') {
            // إذا لم يكن المستخدم مديراً، قم بتوجيهه إلى صفحة تسجيل الدخول
            window.location.href = '/';
        }
    }
    
    // تهيئة علامات التبويب
    function initializeTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // إزالة الفئة النشطة من جميع علامات التبويب
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // إضافة الفئة النشطة إلى علامة التبويب المحددة
                tab.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }
    
    // تحميل العمليات
    async function loadOperations(searchTerm = '') {
        try {
            let operations = [];
            
            // في وضع التطوير، استخدم البيانات المحلية
            if (isDevMode()) {
                operations = JSON.parse(localStorage.getItem('operations') || '[]');
                
                // تطبيق البحث إذا تم تحديد مصطلح البحث
                if (searchTerm) {
                    operations = operations.filter(op => 
                        (op.patientName && op.patientName.includes(searchTerm)) || 
                        (op.operationType && op.operationType.includes(searchTerm)) ||
                        (op.operationDate && op.operationDate.includes(searchTerm))
                    );
                }
                
                renderOperations(operations);
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            let url = `${apiUrl}/operations`;
            
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('فشل تحميل العمليات');
            }
            
            const data = await response.json();
            renderOperations(data.operations);
            
        } catch (error) {
            showMessage(operationsMessage, error.message, 'error');
            console.error('Error loading operations:', error);
        }
    }
    
    // عرض العمليات في الجدول
    function renderOperations(operations) {
        if (!operationsTableBody) return;
        
        operationsTableBody.innerHTML = '';
        
        if (operations.length === 0) {
            operationsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center;">لا توجد عمليات مسجلة</td>
                </tr>
            `;
            return;
        }
        
        operations.forEach((operation, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(operation.operationDate)}</td>
                <td>${operation.patientName}</td>
                <td>${operation.operationType}</td>
                <td>${operation.operationCost}</td>
                <td>${operation.sponsor || '-'}</td>
                <td>${operation.department || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${operation.id || index}">تعديل</button>
                        <button class="delete-btn" data-id="${operation.id || index}">حذف</button>
                        <button class="print-btn" data-id="${operation.id || index}">طباعة</button>
                    </div>
                </td>
            `;
            
            operationsTableBody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف والطباعة
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditOperation);
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteOperation);
        });
        
        document.querySelectorAll('.print-btn').forEach(button => {
            button.addEventListener('click', handlePrintOperation);
        });
    }
    
    // معالجة تقديم نموذج العملية
    async function handleOperationSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(operationForm);
            const operationData = {};
            
            formData.forEach((value, key) => {
                operationData[key] = value;
            });
            
            // في وضع التطوير، استخدم التخزين المحلي
            if (isDevMode()) {
                const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                
                if (editingOperationId !== null) {
                    // تحديث عملية موجودة
                    const index = parseInt(editingOperationId);
                    operations[index] = operationData;
                    showMessage(operationsMessage, 'تم تحديث العملية بنجاح', 'success');
                } else {
                    // إضافة عملية جديدة
                    operationData.id = Date.now().toString();
                    operationData.createdBy = JSON.parse(localStorage.getItem('user') || '{}').id;
                    operations.push(operationData);
                    showMessage(operationsMessage, 'تم إضافة العملية بنجاح', 'success');
                }
                
                localStorage.setItem('operations', JSON.stringify(operations));
                resetOperationForm();
                loadOperations();
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            let url = `${apiUrl}/operations`;
            let method = 'POST';
            
            if (editingOperationId !== null) {
                url += `/${editingOperationId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(operationData)
            });
            
            if (!response.ok) {
                throw new Error('فشل حفظ العملية');
            }
            
            const message = editingOperationId !== null ? 'تم تحديث العملية بنجاح' : 'تم إضافة العملية بنجاح';
            showMessage(operationsMessage, message, 'success');
            
            resetOperationForm();
            loadOperations();
            
        } catch (error) {
            showMessage(operationsMessage, error.message, 'error');
            console.error('Error saving operation:', error);
        }
    }
    
    // معالجة تعديل عملية
    function handleEditOperation(e) {
        const operationId = e.target.getAttribute('data-id');
        
        try {
            // في وضع التطوير، استخدم التخزين المحلي
            if (isDevMode()) {
                const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                const index = parseInt(operationId);
                const operation = operations[index];
                
                if (!operation) {
                    throw new Error('العملية غير موجودة');
                }
                
                // ملء النموذج ببيانات العملية
                document.getElementById('operationDate').value = operation.operationDate || '';
                document.getElementById('patientName').value = operation.patientName || '';
                document.getElementById('operationType').value = operation.operationType || '';
                document.getElementById('operationCost').value = operation.operationCost || '';
                document.getElementById('cardNumber').value = operation.cardNumber || '';
                document.getElementById('sponsor').value = operation.sponsor || '';
                document.getElementById('relationship').value = operation.relationship || '';
                document.getElementById('department').value = operation.department || '';
                
                // تحديث حالة التعديل
                editingOperationId = index;
                saveBtn.textContent = 'تحديث العملية';
                cancelBtn.style.display = 'inline-block';
                
                // التمرير إلى النموذج
                operationForm.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            // (سيتم تنفيذه لاحقاً)
            
        } catch (error) {
            showMessage(operationsMessage, error.message, 'error');
            console.error('Error editing operation:', error);
        }
    }
    
    // معالجة حذف عملية
    async function handleDeleteOperation(e) {
        if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) {
            return;
        }
        
        const operationId = e.target.getAttribute('data-id');
        
        try {
            // في وضع التطوير، استخدم التخزين المحلي
            if (isDevMode()) {
                const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                const index = parseInt(operationId);
                
                operations.splice(index, 1);
                localStorage.setItem('operations', JSON.stringify(operations));
                
                showMessage(operationsMessage, 'تم حذف العملية بنجاح', 'success');
                loadOperations();
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/operations/${operationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('فشل حذف العملية');
            }
            
            showMessage(operationsMessage, 'تم حذف العملية بنجاح', 'success');
            loadOperations();
            
        } catch (error) {
            showMessage(operationsMessage, error.message, 'error');
            console.error('Error deleting operation:', error);
        }
    }
    
    // معالجة طباعة عملية
    function handlePrintOperation(e) {
        const operationId = e.target.getAttribute('data-id');
        
        try {
            // في وضع التطوير، استخدم التخزين المحلي
            if (isDevMode()) {
                const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                const index = parseInt(operationId);
                const operation = operations[index];
                
                if (!operation) {
                    throw new Error('العملية غير موجودة');
                }
                
                // إنشاء نافذة طباعة
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html dir="rtl">
                    <head>
                        <title>طباعة بيانات العملية</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 20px;
                                direction: rtl;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                            }
                            .logo {
                                max-width: 100px;
                                margin-bottom: 10px;
                            }
                            h1 {
                                color: #4CAF50;
                            }
                            .operation-details {
                                border: 1px solid #ddd;
                                padding: 20px;
                                margin-bottom: 30px;
                            }
                            .operation-details h2 {
                                margin-top: 0;
                                color: #4CAF50;
                            }
                            .detail-row {
                                display: flex;
                                margin-bottom: 10px;
                            }
                            .detail-label {
                                font-weight: bold;
                                width: 150px;
                            }
                            .footer {
                                margin-top: 50px;
                                text-align: center;
                                font-size: 12px;
                                color: #777;
                            }
                            @media print {
                                .no-print {
                                    display: none;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <img src="/images/orthopedic.svg" alt="شعار عمليات المواني" class="logo">
                            <h1>عمليات المواني</h1>
                            <p>تقرير بيانات العملية</p>
                        </div>
                        
                        <div class="operation-details">
                            <h2>بيانات العملية</h2>
                            <div class="detail-row">
                                <div class="detail-label">تاريخ العملية:</div>
                                <div>${formatDate(operation.operationDate)}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">اسم المريض:</div>
                                <div>${operation.patientName}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">نوع العملية:</div>
                                <div>${operation.operationType}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">تكلفة العملية:</div>
                                <div>${operation.operationCost}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">رقم البطاقة:</div>
                                <div>${operation.cardNumber || '-'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">الكفيل:</div>
                                <div>${operation.sponsor || '-'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">صلة القرابة:</div>
                                <div>${operation.relationship || '-'}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">الإدارة:</div>
                                <div>${operation.department || '-'}</div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>تم إنشاء هذا التقرير بواسطة نظام عمليات المواني</p>
                            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                        
                        <div class="no-print">
                            <button onclick="window.print()">طباعة</button>
                            <button onclick="window.close()">إغلاق</button>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            // (سيتم تنفيذه لاحقاً)
            
        } catch (error) {
            showMessage(operationsMessage, error.message, 'error');
            console.error('Error printing operation:', error);
        }
    }
    
    // إعادة تعيين نموذج العملية
    function resetOperationForm() {
        operationForm.reset();
        editingOperationId = null;
        saveBtn.textContent = 'حفظ العملية';
        cancelBtn.style.display = 'none';
    }
    
    // تحميل المستخدمين
    async function loadUsers() {
        try {
            let users = [];
            
            // في وضع التطوير، استخدم البيانات المحلية
            if (isDevMode()) {
                users = [
                    { id: 'admin', username: 'admin', name: 'مدير النظام', role: 'admin' },
                    { id: 'user', username: 'user', name: 'مستخدم عادي', role: 'user' }
                ];
                
                renderUsers(users);
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('فشل تحميل المستخدمين');
            }
            
            const data = await response.json();
            renderUsers(data.users);
            
        } catch (error) {
            showMessage(usersMessage, error.message, 'error');
            console.error('Error loading users:', error);
        }
    }
    
    // عرض المستخدمين في القائمة
    function renderUsers(users) {
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        if (users.length === 0) {
            usersList.innerHTML = '<p>لا يوجد مستخدمين مسجلين</p>';
            return;
        }
        
        users.forEach(user => {
            const userItem = document.createElement('li');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div>
                    <h3>${user.name}</h3>
                    <p>اسم المستخدم: ${user.username}</p>
                    <span class="user-role role-${user.role}">${user.role === 'admin' ? 'مدير' : 'مستخدم'}</span>
                </div>
                <div class="action-buttons">
                    <button class="edit-user-btn" data-id="${user.id}">تعديل</button>
                    <button class="delete-user-btn" data-id="${user.id}">حذف</button>
                </div>
            `;
            
            usersList.appendChild(userItem);
        });
        
        // إضافة مستمعي الأحداث لأزرار التعديل والحذف
        document.querySelectorAll('.edit-user-btn').forEach(button => {
            button.addEventListener('click', handleEditUser);
        });
        
        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', handleDeleteUser);
        });
    }
    
    // معالجة تقديم نموذج المستخدم
    async function handleUserSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(userForm);
            const userData = {};
            
            formData.forEach((value, key) => {
                userData[key] = value;
            });
            
            // في وضع التطوير، عرض رسالة نجاح فقط
            if (isDevMode()) {
                const message = editingUserId !== null ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح';
                showMessage(usersMessage, message, 'success');
                resetUserForm();
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            let url = `${apiUrl}/users`;
            let method = 'POST';
            
            if (editingUserId !== null) {
                url += `/${editingUserId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error('فشل حفظ المستخدم');
            }
            
            const message = editingUserId !== null ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح';
            showMessage(usersMessage, message, 'success');
            
            resetUserForm();
            loadUsers();
            
        } catch (error) {
            showMessage(usersMessage, error.message, 'error');
            console.error('Error saving user:', error);
        }
    }
    
    // معالجة تعديل مستخدم
    function handleEditUser(e) {
        const userId = e.target.getAttribute('data-id');
        
        try {
            // في وضع التطوير، ملء النموذج ببيانات افتراضية
            if (isDevMode()) {
                document.getElementById('newUsername').value = 'username';
                document.getElementById('newPassword').value = '';
                document.getElementById('fullName').value = 'الاسم الكامل';
                document.getElementById('userRole').value = 'user';
                
                // تحديث حالة التعديل
                editingUserId = userId;
                saveUserBtn.textContent = 'تحديث المستخدم';
                cancelUserBtn.style.display = 'inline-block';
                
                // التمرير إلى النموذج
                userForm.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            // (سيتم تنفيذه لاحقاً)
            
        } catch (error) {
            showMessage(usersMessage, error.message, 'error');
            console.error('Error editing user:', error);
        }
    }
    
    // معالجة حذف مستخدم
    async function handleDeleteUser(e) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            return;
        }
        
        const userId = e.target.getAttribute('data-id');
        
        try {
            // في وضع التطوير، عرض رسالة نجاح فقط
            if (isDevMode()) {
                showMessage(usersMessage, 'تم حذف المستخدم بنجاح', 'success');
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('فشل حذف المستخدم');
            }
            
            showMessage(usersMessage, 'تم حذف المستخدم بنجاح', 'success');
            loadUsers();
            
        } catch (error) {
            showMessage(usersMessage, error.message, 'error');
            console.error('Error deleting user:', error);
        }
    }
    
    // إعادة تعيين نموذج المستخدم
    function resetUserForm() {
        userForm.reset();
        editingUserId = null;
        saveUserBtn.textContent = 'حفظ المستخدم';
        cancelUserBtn.style.display = 'none';
    }
    
    // معالجة تغيير نوع التقرير
    function handleReportTypeChange() {
        const selectedType = reportType.value;
        
        if (selectedType === 'custom') {
            dateRangeGroup.style.display = 'block';
        } else {
            dateRangeGroup.style.display = 'none';
        }
    }
    
    // معالجة تقديم نموذج التقرير
    async function handleReportSubmit(e) {
        e.preventDefault();
        
        try {
            const selectedType = reportType.value;
            let startDate = '';
            let endDate = '';
            
            if (selectedType === 'custom') {
                startDate = document.getElementById('startDate').value;
                endDate = document.getElementById('endDate').value;
                
                if (!startDate || !endDate) {
                    throw new Error('يرجى تحديد نطاق التاريخ');
                }
            }
            
            // في وضع التطوير، استخدم البيانات المحلية
            if (isDevMode()) {
                const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                let filteredOperations = [...operations];
                
                // تطبيق تصفية التاريخ
                if (selectedType === 'daily') {
                    const today = new Date().toISOString().split('T')[0];
                    filteredOperations = operations.filter(op => op.operationDate === today);
                } else if (selectedType === 'monthly') {
                    const currentMonth = new Date().getMonth() + 1;
                    const currentYear = new Date().getFullYear();
                    filteredOperations = operations.filter(op => {
                        const opDate = new Date(op.operationDate);
                        return opDate.getMonth() + 1 === currentMonth && opDate.getFullYear() === currentYear;
                    });
                } else if (selectedType === 'custom') {
                    filteredOperations = operations.filter(op => {
                        return op.operationDate >= startDate && op.operationDate <= endDate;
                    });
                }
                
                // عرض نتائج التقرير
                renderReportResults(filteredOperations, selectedType, startDate, endDate);
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            // (سيتم تنفيذه لاحقاً)
            
        } catch (error) {
            showMessage(reportsMessage, error.message, 'error');
            console.error('Error generating report:', error);
        }
    }
    
    // عرض نتائج التقرير
    function renderReportResults(operations, reportType, startDate, endDate) {
        if (!reportContent || !reportResults) return;
        
        // حساب الإحصائيات
        const totalOperations = operations.length;
        const totalCost = operations.reduce((sum, op) => sum + parseFloat(op.operationCost || 0), 0);
        const operationTypes = {};
        
        operations.forEach(op => {
            if (op.operationType) {
                operationTypes[op.operationType] = (operationTypes[op.operationType] || 0) + 1;
            }
        });
        
        // تحديد عنوان التقرير
        let reportTitle = '';
        if (reportType === 'daily') {
            reportTitle = `تقرير يومي (${new Date().toLocaleDateString('ar-EG')})`;
        } else if (reportType === 'monthly') {
            const date = new Date();
            reportTitle = `تقرير شهري (${date.getMonth() + 1}/${date.getFullYear()})`;
        } else if (reportType === 'custom') {
            reportTitle = `تقرير مخصص (${formatDate(startDate)} - ${formatDate(endDate)})`;
        }
        
        // إنشاء محتوى التقرير
        reportContent.innerHTML = `
            <div class="report-header">
                <h3>${reportTitle}</h3>
                <p>تاريخ إنشاء التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            <div class="report-summary">
                <h4>ملخص التقرير</h4>
                <p>إجمالي عدد العمليات: ${totalOperations}</p>
                <p>إجمالي تكلفة العمليات: ${totalCost.toFixed(2)}</p>
            </div>
            
            <div class="report-details">
                <h4>تفاصيل العمليات</h4>
                ${totalOperations > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>تاريخ العملية</th>
                                <th>اسم المريض</th>
                                <th>نوع العملية</th>
                                <th>تكلفة العملية</th>
                                <th>الكفيل</th>
                                <th>الإدارة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${operations.map((op, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${formatDate(op.operationDate)}</td>
                                    <td>${op.patientName}</td>
                                    <td>${op.operationType}</td>
                                    <td>${op.operationCost}</td>
                                    <td>${op.sponsor || '-'}</td>
                                    <td>${op.department || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>لا توجد عمليات في هذه الفترة</p>'}
            </div>
        `;
        
        // عرض نتائج التقرير
        reportResults.style.display = 'block';
        reportResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    // طباعة التقرير
    function printReport() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>طباعة التقرير</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        direction: rtl;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .logo {
                        max-width: 100px;
                        margin-bottom: 10px;
                    }
                    h1, h2, h3, h4 {
                        color: #4CAF50;
                    }
                    .report-content {
                        margin-bottom: 30px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/images/orthopedic.svg" alt="شعار عمليات المواني" class="logo">
                    <h1>عمليات المواني</h1>
                </div>
                
                <div class="report-content">
                    ${reportContent.innerHTML}
                </div>
                
                <div class="footer">
                    <p>تم إنشاء هذا التقرير بواسطة نظام عمليات المواني</p>
                    <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
                
                <div class="no-print">
                    <button onclick="window.print()">طباعة</button>
                    <button onclick="window.close()">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // معالجة البحث
    function handleSearch(e) {
        const searchTerm = e.target.value.trim();
        loadOperations(searchTerm);
    }
    
    // عرض رسالة
    function showMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = `message message-${type}`;
        element.style.display = 'block';
        
        // إخفاء الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // تنسيق التاريخ
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG');
    }
    
    // التحقق مما إذا كان التطبيق في وضع التطوير
    function isDevMode() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
});
