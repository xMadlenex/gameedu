const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// High-resolution canvas for sharp visuals
const DISPLAY_WIDTH = 800;
const DISPLAY_HEIGHT = 600;

canvas.width = DISPLAY_WIDTH * 2; // Double the resolution
canvas.height = DISPLAY_HEIGHT * 2;

canvas.style.width = `${DISPLAY_WIDTH}px`; // CSS display size
canvas.style.height = `${DISPLAY_HEIGHT}px`;

ctx.scale(2, 2); // Scale everything for high-resolution rendering

const SHELF_Y_POSITIONS = [90, 210, 330];
const INITIAL_BUDGET = Math.floor(Math.random() * 6) + 10;

let shoppingLocked = false;
let quizCompleted = false;
let commentText = "Witaj w symulatorze sklepiku szkolnego! Koledzy dali Ci swoje kieszonkowe i poprosili o kupienie przekąsek, aby przetrwać lekcje.  Znajdź produkty z listy i kliknij w nie, aby żaden bambik nie kupił ich przed tobą! Pamiętaj, ile masz zielonych w portfelu, w końcu jakoś za to wszystko będziesz musiał zapłacić...";

const shoppingCart = [];
const CHEERFUL_COMMENTS = [
    "CONSUMER MASTER! 🌟 Nikt nie robi zakupów jak ty!",
    "SHOP LIKE A BOSS! 👑 Pokaż im jak się robi zakupy!",
    "LECISZ TUTAJ JAK ZYGZAK MCQUEEN! ⚡",
    "BIZNES SHARK MODE: ON! 🦈",
    "LIFEHACK: 1 zł = 100 gr! 💡",
    "POV: Jesteś main character i wiesz jak wydawać zielone! 💰"

];
const GAME_OVER = [
    "EVEN STONKS MASTERS MAKE MISTAKES! 📉 Sprawdź obliczenia i spróbuj ponownie.",
    "BZZZT! BIZNES PLAN WYMAGA KOREKTY! 📊 BIZNES RADA: Użyj kalkulatora w głowie! 🧠",
    "BUDŻET SIĘ NIE ZGADZA, ALE SPOKOJNIE PANI KRYSIA RZUCA CI KOŁO RATUNKOWE! Każda złotówka to sto groszy!",
    "ALE Z CIEBIE BAMBIK, policz jeszcze raz, pamiętaj 100 groszy = 1 zł! "

];
const PRODUCT_MAPPING = {
    "Kup coś słonego": { name: "Popcorn", emoji: "🍿"},
    "Kup coś słodkiego": { name: "Lody ekipy", emoji: "🍧"},
    "Kup coś czekoladowego": { name: "Milka", emoji: "🍫"},
    "Kup coś owocowego do picia": { name: "Kubuś", emoji: "🧃" },
    "Kup coś na lunch": { name: "Kebsik", emoji: "🌯"},
    "Kup owoc": { name: "Jabłko", emoji: "🍎"},
    "Kup coś gazowanego": { name: "Colka", emoji: "🥤" }
};

class Product {
    constructor(name, emoji, price, x, y, size) {
        this.name = name;
        this.emoji = emoji;
        this.price = price;
        this.x = x;
        this.y = y;
        this.size = size;
        this.boxWidth = 240;
        this.boxHeight = 120;
    }

    draw() {
        const emojiX = this.x + this.boxWidth / 2;
        const emojiY = this.y;
        const textY = this.y + 25;

        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(this.emoji, emojiX, emojiY);

        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(this.name, emojiX, textY + 10);
        ctx.fillText(`${this.price.toFixed(2)} zł`, emojiX, textY + 30);
    }

    isClicked(mouseX, mouseY) {
        return (
            mouseX > this.x &&
            mouseX < this.x + this.boxWidth &&
            mouseY > this.y - this.size &&
            mouseY < this.y + 50
        );
    }
}

class Seller {
    constructor(emoji, x, y, size) {
        this.emoji = emoji;
        this.x = x;
        this.y = y;
        this.size = size;
    }

    draw() {
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(this.emoji, this.x, this.y);

        this.drawCommentBox();
    }

    drawCommentBox() {
        const boxWidth = 450;
        const boxHeight = 120;
        const boxX = (this.x / 2) - (boxWidth / 2);
        const boxY = ((SHELF_Y_POSITIONS[SHELF_Y_POSITIONS.length - 1] + 20 + this.y - this.size) / 2) + (boxHeight / 2);

        ctx.fillStyle = "#f9f9f9";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#333";

        const lineHeight = 18;
        const lines = this.getWrappedText(ctx, commentText, boxWidth - 20);
        const totalHeight = lines.length * lineHeight;
        let y = boxY + (boxHeight - totalHeight) / 2 + lineHeight;

        lines.forEach(line => {
            ctx.fillText(line, boxX + boxWidth / 2, y);
            y += lineHeight;
        });
    }

    getWrappedText(ctx, text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let line = "";

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth) {
                lines.push(line);
                line = words[i] + " ";
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        return lines;
    }
}

const products = [];
SHELF_Y_POSITIONS.forEach((y, shelfIndex) => {
    const slotWidth = DISPLAY_WIDTH / 3;
    for (let i = 0; i < 3; i++) {
        const slotCenter = i * slotWidth + slotWidth / 2;
        const productX = slotCenter - 120;
        const productData = Object.values(PRODUCT_MAPPING)[(shelfIndex * 3 + i) % Object.keys(PRODUCT_MAPPING).length];
        products.push(new Product(
            productData.name,
            productData.emoji,
            getRandomPrice(),
            productX,
            y + 15,
            50
        ));
    }
});

const seller = new Seller("💁‍♀️", DISPLAY_WIDTH - 80, DISPLAY_HEIGHT - 10, 140);

function getRandomPrice() {
    return Math.round((Math.random() * 2 + 1) * 100) / 100;
}

function drawShelves() {
    ctx.fillStyle = "#8B4513";
    SHELF_Y_POSITIONS.forEach(y => ctx.fillRect(0, y + 20, DISPLAY_WIDTH, 10));
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawShelves();
    products.forEach(product => product.draw());
    seller.draw();
}

function updateBudgetDisplay() {
    document.getElementById("budget").textContent = `Portfel: ${INITIAL_BUDGET.toFixed(2)} zł`;
}

function generateGroceryList() {
    const listItems = document.getElementById("listItems");
    listItems.innerHTML = "";

    const selectedProducts = [];
    const productPool = [...products];

    while (selectedProducts.length < 3 && productPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * productPool.length);
        const selectedProduct = productPool.splice(randomIndex, 1)[0];
        if (!selectedProducts.find(product => product.name === selectedProduct.name)) {
            selectedProducts.push(selectedProduct);
        }
    }

    selectedProducts.forEach(product => {
        const li = document.createElement("li");
        li.textContent = Object.keys(PRODUCT_MAPPING).find(
            key => PRODUCT_MAPPING[key].name === product.name
        );
        li.dataset.item = product.name;
        listItems.appendChild(li);
    });

    updateBudgetDisplay();
}

function updateGroceryListCrosslines() {
    const listItems = document.querySelectorAll("#listItems li");
    listItems.forEach(li => {
        if (shoppingCart.some(cartItem => cartItem.name === li.dataset.item)) {
            li.style.textDecoration = "line-through";
            li.style.color = "gray";
        } else {
            li.style.textDecoration = "none";
            li.style.color = "black";
        }
    });
}

function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    cartItems.innerHTML = "";

    shoppingCart.forEach((product, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${product.emoji} ${product.name} - ${product.price.toFixed(2)} zł`;
        li.dataset.index = index;

        if (!shoppingLocked) {
            li.addEventListener("click", () => {
                shoppingCart.splice(index, 1);
                updateCartDisplay();
            });
        }

        cartItems.appendChild(li);
    });

    const finishButton = document.getElementById("finishShoppingButton");

    if (shoppingCart.length > 0 && !finishButton) {
        const button = document.createElement("button");
        button.id = "finishShoppingButton";
        button.textContent = "Zakończ zakupy";
        button.style.marginTop = "10px";
        button.addEventListener("click", () => {
            shoppingLocked = true;
            button.disabled = true;
            disableCartInteraction();
            showQuizSection();
            render();
        });
        cartItems.appendChild(button);
    } else if (shoppingCart.length === 0 && finishButton) {
        finishButton.remove();
    }
}

function disableCartInteraction() {
    const cartItems = document.querySelectorAll("#cartItems li");
    cartItems.forEach(item => {
        const clonedItem = item.cloneNode(true);
        item.replaceWith(clonedItem);
    });
}

function showQuizSection() {
    const quizSection = document.getElementById("quizSection");
    quizSection.style.display = "block";

    const checkAnswerButton = document.getElementById("checkAnswerButton");
    checkAnswerButton.addEventListener("click", () => {
        const totalSpentInput = parseFloat(document.getElementById("totalSpentInput").value);
        const remainingBudgetInput = parseFloat(document.getElementById("remainingBudgetInput").value);

        const totalSpent = shoppingCart.reduce((sum, product) => sum + product.price, 0).toFixed(2);
        const correctRemainingBudget = Math.max(0, (INITIAL_BUDGET - totalSpent).toFixed(2));

        const feedback = document.getElementById("quizFeedback");

        if (
            totalSpentInput.toFixed(2) == totalSpent &&
            remainingBudgetInput.toFixed(2) == correctRemainingBudget
        ) {
        commentText = " BRAWO GRA UKOŃCZONA! Lista zakupów: DEMOLISHED!💫 Obliczenia: Precyzyjne Portfel: Każdy grosz policzony! Rank: GIGA MONEY MASTER!💸"
            feedback.style.color = "green";
            quizCompleted = true;
            updateGroceryListCrosslines();
        } else {
            commentText = GAME_OVER[Math.floor(Math.random() * GAME_OVER.length)];
            feedback.style.color = "red";
        }

        render();
    });
}

function handleProductClick(product) {
    if (shoppingLocked) return;
    shoppingCart.push(product);
    commentText = CHEERFUL_COMMENTS[Math.floor(Math.random() * CHEERFUL_COMMENTS.length)];
    updateCartDisplay();
    render();
}

canvas.addEventListener("click", event => {
    if (shoppingLocked) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    products.forEach(product => {
        if (product.isClicked(mouseX, mouseY)) {
            handleProductClick(product);
        }
    });
});

generateGroceryList();
render();
