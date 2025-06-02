// عمليات المواني - ملف إدارة المستخدم العادي
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود جلسة مسجلة وصلاحيات المستخدم
    checkUserAuth();
    
    // المتغيرات العامة
    const apiUrl = 'https://api.operations-app.com'; // سيتم تغييره لاحقاً للرابط الفعلي للواجهة الخلفية
    const operationForm = document.getElementById('operationForm');
    const operationsMessage = document.getElementById('operationsMessage');
    const myOperationsMessage = document.getElementById('myOperationsMessage');
    const myOperationsTableBody = document.getElementById('myOperationsTableBody');
    const searchInput = document.getElementById('searchInput');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    let editingOperationId = null;
    let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // تهيئة التطبيق
    initializeTabs();
    loadMyOperations();
    
    // إضافة مستمعي الأحداث
    if (operationForm) {
        operationForm.addEventListener('submit', handleOperationSubmit);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetOperationForm);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // التحقق من صلاحيات المستخدم
    function checkUserAuth() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // عرض اسم المستخدم
        const userNameElement = document.getElementById('userName');
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
        
        // التحقق من صلاحيات المستخدم
        if (!user.role || user.role === 'admin') {
            // إذا كان المستخدم مديراً، قم بتوجيهه إلى صفحة المدير
            window.location.href = '/admin.html';
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
    
    // تحميل العمليات الخاصة بالمستخدم
    async function loadMyOperations(searchTerm = '') {
        try {
            let operations = [];
            
            // في وضع التطوير، استخدم البيانات المحلية
            if (isDevMode()) {
                operations = JSON.parse(localStorage.getItem('operations') || '[]');
                
                // تصفية العمليات الخاصة بالمستخدم الحالي
                operations = operations.filter(op => op.createdBy === currentUser.id);
                
                // تطبيق البحث إذا تم تحديد مصطلح البحث
                if (searchTerm) {
                    operations = operations.filter(op => 
                        (op.patientName && op.patientName.includes(searchTerm)) || 
                        (op.operationType && op.operationType.includes(searchTerm)) ||
                        (op.operationDate && op.operationDate.includes(searchTerm))
                    );
                }
                
                renderMyOperations(operations);
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            const token = localStorage.getItem('token');
            let url = `${apiUrl}/operations/my`;
            
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
            renderMyOperations(data.operations);
            
        } catch (error) {
            showMessage(myOperationsMessage, error.message, 'error');
            console.error('Error loading operations:', error);
        }
    }
    
    // عرض العمليات في الجدول
    function renderMyOperations(operations) {
        if (!myOperationsTableBody) return;
        
        myOperationsTableBody.innerHTML = '';
        
        if (operations.length === 0) {
            myOperationsTableBody.innerHTML = `
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
            
            myOperationsTableBody.appendChild(row);
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
                    operationData.createdBy = currentUser.id;
                    operations.push(operationData);
                    showMessage(operationsMessage, 'تم إضافة العملية بنجاح', 'success');
                }
                
                localStorage.setItem('operations', JSON.stringify(operations));
                resetOperationForm();
                loadMyOperations();
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
            loadMyOperations();
            
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
                
                // تبديل إلى علامة التبويب الأولى
                document.querySelector('.tab[data-tab="operations"]').click();
                
                return;
            }
            
            // في وضع الإنتاج، اتصل بالواجهة الخلفية
            // (سيتم تنفيذه لاحقاً)
            
        } catch (error) {
            showMessage(myOperationsMessage, error.message, 'error');
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
                
                showMessage(myOperationsMessage, 'تم حذف العملية بنجاح', 'success');
                loadMyOperations();
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
            
            showMessage(myOperationsMessage, 'تم حذف العملية بنجاح', 'success');
            loadMyOperations();
            
        } catch (error) {
            showMessage(myOperationsMessage, error.message, 'error');
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
            showMessage(myOperationsMessage, error.message, 'error');
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
    
    // معالجة البحث
    function handleSearch(e) {
        const searchTerm = e.target.value.trim();
        loadMyOperations(searchTerm);
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
