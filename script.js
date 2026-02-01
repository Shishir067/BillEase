// 🔥 Firebase Configuration
var firebaseConfig = {
  apiKey: "API KEY",
  authDomain: "URL",
  projectId: "Project ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global states
let totalVisible = false;
let categoryChart;

// Set default date in Add Expense input after DOM ready
window.onload = () => {
  document.getElementById("expenseDate").valueAsDate = new Date();
};

//add exp
function addExpense() {
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const note = document.getElementById("note").value;
  const dateInput = document.getElementById("expenseDate").value;
  const expenseDate = dateInput ? new Date(dateInput) : new Date();

  if (amount === "") {
    alert("Please enter an amount");
    return;
  }

  db.collection("expenses").add({
    amount: Number(amount),
    category: category,
    note: note,
    date: expenseDate
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  document.getElementById("expenseDate").valueAsDate = new Date();
}
//add bill
function addBill() {
  const name = document.getElementById("billName").value;
  const amount = document.getElementById("billAmount").value;
  const dueDateInput = document.getElementById("billDueDate").value;
  const note = document.getElementById("billNote").value;

  if(!name || !amount || !dueDateInput) {
    alert("Please enter all required fields");
    return;
  }

  const dueDate = new Date(dueDateInput);

  db.collection("bills").add({
    name: name,
    amount: Number(amount),
    dueDate: dueDate,
    note: note
  });
function showBillReminders() {
  const today = new Date();
  today.setHours(0,0,0,0);

  const reminderList = document.getElementById("billReminders");
  reminderList.innerHTML = "";

  db.collection("bills")
    .where("dueDate", ">=", today)
    .orderBy("dueDate")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const due = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
        const li = document.createElement("li");
        li.textContent = `${data.name}: ₹${data.amount} due on ${due.toISOString().split('T')[0]} ${data.note ? '- ' + data.note : ''}`;
        reminderList.appendChild(li);
      });
    });
}

  // Clear inputs
  document.getElementById("billName").value = "";
  document.getElementById("billAmount").value = "";
  document.getElementById("billDueDate").value = "";
  document.getElementById("billNote").value = "";

  // Refresh reminders
  showBillReminders();
}

//toggle
function toggleTotal() {
  const totalEl = document.getElementById("monthlyTotal");
  const btn = document.getElementById("toggleTotalBtn");

  totalVisible = !totalVisible;
  if (totalVisible) {
    totalEl.style.display = "block";
    btn.textContent = "Hide Total Spending";
  } else {
    totalEl.style.display = "none";
    btn.textContent = "Show Total Spending";
  }
}

//clear
function clearAllExpenses() {
  if(!confirm("Are you sure you want to delete all expenses?")) return;

  db.collection("expenses").get().then(snapshot => {
    snapshot.forEach(doc => {
      db.collection("expenses").doc(doc.id).delete();
    });
  });
}

//filter
function filterByDate() {
  const dateVal = document.getElementById("filterDate").value;
  if(!dateVal) return alert("Select a date");

  const selectedDate = new Date(dateVal);
  const start = new Date(selectedDate.setHours(0,0,0,0));
  const end = new Date(selectedDate.setHours(23,59,59,999));

  db.collection("expenses")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get()
    .then(snapshot => {
      const list = document.getElementById("editExpenseList");
      list.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const expenseDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
        const li = document.createElement("li");
        li.innerHTML = `
          ₹${data.amount} • ${data.category} • ${data.note || "No note"} • ${expenseDate.toISOString().split('T')[0]}
          <button onclick="editExpense('${doc.id}', ${data.amount}, '${data.category}', '${data.note || ""}', '${expenseDate.toISOString().split('T')[0]}')">Edit</button>
        `;
        list.appendChild(li);
      });
    });
}


function editExpense(docId, oldAmount, oldCategory, oldNote, oldDate) {
  const newAmount = prompt("Enter new amount:", oldAmount);
  if(newAmount === null) return;

  const newCategory = prompt("Enter new category:", oldCategory);
  if(newCategory === null) return;

  const newNote = prompt("Enter new note:", oldNote);
  if(newNote === null) return;

  const newDate = prompt("Enter date (YYYY-MM-DD):", oldDate);
  if(newDate === null) return;

  db.collection("expenses").doc(docId).update({
    amount: Number(newAmount),
    category: newCategory,
    note: newNote,
    date: new Date(newDate)
  });
}

db.collection("expenses")
  .orderBy("date", "desc")
  .onSnapshot(snapshot => {
    const list = document.getElementById("expenseList");
    const summaryList = document.getElementById("categorySummary");
    const monthlyTotalEl = document.getElementById("monthlyTotal");

    list.innerHTML = "";
    summaryList.innerHTML = "";

    const categoryTotals = {};
    let monthlyTotal = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    snapshot.forEach(doc => {
      const data = doc.data();
      const expenseDate = data.date.toDate ? data.date.toDate() : new Date(data.date);

      // Expense list
      const li = document.createElement("li");
      li.textContent = `₹${data.amount} • ${data.category} • ${data.note || "No note"} • ${expenseDate.toISOString().split('T')[0]}`;
      list.appendChild(li);

      // Category totals
      if(categoryTotals[data.category]) {
        categoryTotals[data.category] += data.amount;
      } else {
        categoryTotals[data.category] = data.amount;
      }

      // Monthly total
      if(expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        monthlyTotal += data.amount;
      }
      // 1️ Average daily spending
const now = new Date();
const daysPassed = now.getDate(); // number of days passed this month
const avgDailySpending = (monthlyTotal / daysPassed).toFixed(2);

// 2️ Highest expense
let highest = 0;
snapshot.forEach(doc => {
  const data = doc.data();
  const expenseDate = data.date.toDate ? data.date.toDate() : new Date(data.date);
  if(expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
    if(data.amount > highest) highest = data.amount;
  }
});

// 3️ Update UI
document.getElementById("monthlyTotalReport").textContent = `Total Spending: ₹${monthlyTotal}`;
document.getElementById("avgDaily").textContent = `Average Daily Spending: ₹${avgDailySpending}`;
document.getElementById("highestExpense").textContent = `Highest Expense: ₹${highest}`;


    });

    // Render monthly total
    monthlyTotalEl.textContent = `₹${monthlyTotal}`;
    monthlyTotalEl.style.display = totalVisible ? "block" : "none";

    // Render category summary
    for(let category in categoryTotals) {
      const li = document.createElement("li");
      li.textContent = `${category}: ₹${categoryTotals[category]}`;
      summaryList.appendChild(li);
    }

    // Pie chart (once per snapshot)
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);

    if(categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: ['#4CAF50','#FF9800','#2196F3','#9C27B0','#F44336','#FFC107']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  });
