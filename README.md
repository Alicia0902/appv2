# Budget Management Tool

## Overview
This budget management tool is designed to help users track their savings goals, income, expenses, and investment performance. The application provides a user-friendly interface that is optimized for both desktop and mobile devices, ensuring a seamless experience on a MacBook 13-inch and iPhone 16 Pro Max.

## Features
- **Savings Goals**: Users can set, modify, and track their savings goals with visual indicators for progress.
- **Income Tracking**: Easily add and remove income entries, with a summary of total income over a specified period.
- **Expense Tracking**: Manage expenses by adding and removing entries, with a clear overview of total expenses.
- **Investment Performance**: Track investments with an ETF tracker that allows users to input monthly investment amounts and project expected values based on different growth rates.

## File Structure
```
budget-management-app
├── index.html
├── css
│   ├── style.css
│   └── responsive.css
├── js
│   ├── app.js
│   ├── savings.js
│   ├── income.js
│   ├── expenses.js
│   └── investments.js
└── README.md
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in your web browser to view the application.
3. Ensure that all CSS and JavaScript files are linked correctly for full functionality.

## Usage Guidelines
- Navigate through the application using the dashboard to access different features.
- Use the input forms to add income and expenses, and set savings goals.
- Monitor your investment performance through the ETF tracker, adjusting inputs as necessary to see projected returns.

## User Interface Design
The application features a minimalist design that aligns with iOS aesthetics, focusing on ease of use and accessibility. Interactive elements such as sliders and input fields enhance user engagement and facilitate financial tracking.

## Calculations
- **Total Investment**: Sum of all monthly investments.
- **Expected Value**: Total Investment * (1 + growth rate) ^ number of months.
- **Optimistic Projection**: Total Investment * (1 + 0.10) ^ number of months.
- **Pessimistic Projection**: Total Investment * (1 + 0.04) ^ number of months.

This README provides a comprehensive overview of the budget management tool, ensuring users understand its capabilities and how to effectively utilize the application for their financial tracking needs.