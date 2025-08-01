// Класс для управления данными приложения
class DogSalesApp {
    constructor() {
        this.dogs = [];
        this.sales = [];
        this.balances = { partner1: 0, partner2: 0 };
        this.breedNames = {
            'cocker': 'Английский кокер спаниель',
            'maltipoo': 'Мальтипу'
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
        this.setDefaultDates();
    }

    // Загрузка данных из localStorage
    loadData() {
        const savedData = localStorage.getItem('dogSalesData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.dogs = data.dogs || [];
            this.sales = data.sales || [];
            this.balances = data.balances || { partner1: 0, partner2: 0 };
        }
    }

    // Сохранение данных в localStorage
    saveData() {
        const data = {
            dogs: this.dogs,
            sales: this.sales,
            balances: this.balances
        };
        localStorage.setItem('dogSalesData', JSON.stringify(data));
    }

    // Установка обработчиков событий
    setupEventListeners() {
        // Навигация по вкладкам
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.screen));
        });

        // Форма добавления собаки
        document.getElementById('addDogForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addDog();
        });

        // Форма добавления продажи
        document.getElementById('addSaleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSale();
        });

        // Изменение способа оплаты или продавца
        ['payment', 'seller'].forEach(name => {
            document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
                radio.addEventListener('change', () => this.updateMoneyRecipient());
            });
        });

        // Кнопка очистки истории
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('Вы уверены? Это удалит всю историю и обнулит балансы.')) {
                this.clearHistory();
            }
        });
    }

    // Установка текущей даты по умолчанию
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('saleDate').value = today;
    }

    // Переключение вкладок
    switchTab(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(screenId).classList.add('active');
        document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');
        
        this.updateUI();
    }

    // Добавление собаки
    addDog() {
        const dog = {
            id: Date.now(),
            breed: document.getElementById('dogBreed').value,
            gender: document.querySelector('input[name="dogGender"]:checked').value,
            birthDate: document.getElementById('dogBirthDate').value,
            owner: document.querySelector('input[name="dogOwner"]:checked').value
        };

        this.dogs.push(dog);
        this.saveData();
        this.updateUI();
        
        // Очистка формы
        document.getElementById('addDogForm').reset();
        alert('Собака добавлена!');
    }

    // Добавление продажи
    addSale() {
        const breed = document.getElementById('saleBreed').value;
        const gender = document.querySelector('input[name="saleGender"]:checked').value;
        const seller = document.querySelector('input[name="seller"]:checked').value;
        
        // Поиск подходящей собаки
        const dogIndex = this.dogs.findIndex(dog => 
            dog.breed === breed && 
            dog.gender === gender && 
            dog.owner === seller
        );

        if (dogIndex === -1) {
            alert('Нет подходящей собаки для продажи!');
            return;
        }

        const soldDog = this.dogs[dogIndex];
        const price = parseInt(document.getElementById('salePrice').value);
        const payment = document.querySelector('input[name="payment"]:checked').value;
        
        // Определение получателя денег
        const moneyRecipient = payment === 'cash' ? seller : (seller === '1' ? '2' : '1');

        // Создание записи о продаже
        const sale = {
            id: Date.now(),
            date: document.getElementById('saleDate').value,
            breed: breed,
            gender: gender,
            birthDate: soldDog.birthDate,
            seller: seller,
            price: price,
            payment: payment,
            moneyRecipient: moneyRecipient
        };

        // Обновление баланса
        if (moneyRecipient === '1') {
            this.balances.partner1 += price;
        } else {
            this.balances.partner2 += price;
        }

        // Удаление проданной собаки
        this.dogs.splice(dogIndex, 1);
        
        // Добавление продажи
        this.sales.push(sale);
        
        this.saveData();
        this.updateUI();
        
        // Очистка формы
        document.getElementById('addSaleForm').reset();
        this.setDefaultDates();
        alert('Продажа добавлена!');
    }

    // Обновление получателя денег
    updateMoneyRecipient() {
        const seller = document.querySelector('input[name="seller"]:checked').value;
        const payment = document.querySelector('input[name="payment"]:checked').value;
        
        let recipient;
        if (payment === 'cash') {
            recipient = `Партнер ${seller} (продавец)`;
        } else {
            recipient = `Партнер ${seller === '1' ? '2' : '1'}`;
        }
        
        document.getElementById('moneyRecipient').textContent = recipient;
    }

    // Очистка истории
    clearHistory() {
        this.sales = [];
        this.balances = { partner1: 0, partner2: 0 };
        this.saveData();
        this.updateUI();
    }

    // Удаление собаки
    deleteDog(id) {
        if (confirm('Удалить эту собаку?')) {
            this.dogs = this.dogs.filter(dog => dog.id !== id);
            this.saveData();
            this.updateUI();
        }
    }

    // Обновление интерфейса
    updateUI() {
        this.updateBalances();
        this.updateDogSummary();
        this.updateDogsList();
        this.updateAvailableInfo();
        this.updateHistory();
    }

    // Обновление балансов
    updateBalances() {
        document.getElementById('balance1').textContent = this.formatNumber(this.balances.partner1);
        document.getElementById('balance2').textContent = this.formatNumber(this.balances.partner2);
        document.getElementById('balanceTotal').textContent = 
            this.formatNumber(this.balances.partner1 + this.balances.partner2);
    }

    // Обновление сводки по собакам
    updateDogSummary() {
        const summary = document.getElementById('dogSummary');
        const breeds = ['cocker', 'maltipoo'];
        
        let html = '';
        breeds.forEach(breed => {
            const breedDogs = this.dogs.filter(dog => dog.breed === breed);
            const males = breedDogs.filter(dog => dog.gender === 'male').length;
            const females = breedDogs.filter(dog => dog.gender === 'female').length;
            const partner1 = breedDogs.filter(dog => dog.owner === '1').length;
            const partner2 = breedDogs.filter(dog => dog.owner === '2').length;
            
            if (breedDogs.length > 0) {
                html += `
                    <div class="breed-section">
                        <div class="breed-title">${this.breedNames[breed]}</div>
                        <div class="dog-stats">
                            <div class="stat-item">
                                <span class="gender-icon male">♂</span>
                                <span>Кобели: ${males}</span>
                            </div>
                            <div class="stat-item">
                                <span class="gender-icon female">♀</span>
                                <span>Суки: ${females}</span>
                            </div>
                        </div>
                        <div class="partner-breakdown">
                            <span>П1: ${partner1} шт</span>
                            <span>П2: ${partner2} шт</span>
                        </div>
                    </div>
                `;
            }
        });
        
        summary.innerHTML = html || '<div class="no-data">Нет собак</div>';
    }

    // Обновление списка собак
    updateDogsList() {
        const list = document.getElementById('dogsList');
        
        if (this.dogs.length === 0) {
            list.innerHTML = '<div class="no-data">Нет собак</div>';
            return;
        }
        
        let html = '';
        this.dogs.forEach(dog => {
            const genderSymbol = dog.gender === 'male' ? '♂' : '♀';
            const genderText = dog.gender === 'male' ? 'Кобель' : 'Сука';
            const birthDate = new Date(dog.birthDate).toLocaleDateString('ru-RU');
            
            html += `
                <div class="dog-item">
                    <div class="dog-info">
                        <div class="dog-breed-name">${this.breedNames[dog.breed]}</div>
                        <div class="dog-details">${genderSymbol} ${genderText} • Родился: ${birthDate}</div>
                        <div class="dog-owner">Партнер ${dog.owner}</div>
                    </div>
                    <button class="delete-btn" onclick="app.deleteDog(${dog.id})">Удалить</button>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Обновление информации о доступных собаках
    updateAvailableInfo() {
        const info = document.getElementById('availableInfo');
        const breeds = ['cocker', 'maltipoo'];
        
        let html = '<strong>Доступно для продажи:</strong><br>';
        breeds.forEach(breed => {
            const breedDogs = this.dogs.filter(dog => dog.breed === breed);
            const males = breedDogs.filter(dog => dog.gender === 'male').length;
            const females = breedDogs.filter(dog => dog.gender === 'female').length;
            
            if (breedDogs.length > 0) {
                const breedName = breed === 'cocker' ? 'Англ. кокер' : 'Мальтипу';
                html += `${breedName}: ♂ ${males} шт, ♀ ${females} шт<br>`;
            }
        });
        
        info.innerHTML = html;
    }

    // Обновление истории
    updateHistory() {
        const list = document.getElementById('historyList');
        
        if (this.sales.length === 0) {
            list.innerHTML = '<div class="no-data">История пуста</div>';
            return;
        }
        
        let html = '';
        this.sales.slice().reverse().forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString('ru-RU');
            const genderSymbol = sale.gender === 'male' ? '♂' : '♀';
            const genderText = sale.gender === 'male' ? 'Кобель' : 'Сука';
            const birthDate = new Date(sale.birthDate).toLocaleDateString('ru-RU');
            const paymentText = sale.payment === 'cash' ? 'Наличные' : 'Карта';
            
            html += `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-date">${date}</span>
                        <span class="history-price">${this.formatNumber(sale.price)}</span>
                    </div>
                    <div class="history-details">
                        ${this.breedNames[sale.breed]} • Продал: П${sale.seller} • ${paymentText} → П${sale.moneyRecipient}
                    </div>
                    <div class="history-dog-info">
                        ${genderSymbol} ${genderText} • Родился: ${birthDate}
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Форматирование чисел
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

// Инициализация приложения
const app = new DogSalesApp();

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Service Worker не зарегистрирован:', err));
    });
}