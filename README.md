# Budget Blitz

**Budget Blitz** is a lightweight browser game that challenges you to manage a month’s finances in just 60 seconds. You start with a monthly income and must decide, card by card, which expenses to approve or decline. The goal is to finish with a positive balance while meeting essential needs such as groceries, transport and utilities. Your performance is measured by a *Quality Index* (meeting essentials), a *Frugality Index* (avoiding overspending) and your final balance.

## How to Play

1. **Start** – Click **Start Game** on the landing screen.
2. **Approve or Decline** – Expense cards appear one at a time. Each card shows the category, amount and a short note. You have 3 seconds to make a decision:
   - *Approve* the expense by clicking the **Approve** button or pressing **A**. On touch devices, swipe right.
   - *Decline* the expense by clicking the **Decline** button or pressing **D**. On touch devices, swipe left.
   - If you ignore a card for more than 3 seconds it counts as **Missed**.
3. **Pause** – Use the **Pause** button or press **Space** to pause/resume the game.
4. **Results** – At the end of 60 seconds (or if your balance drops below –₹10 000) you’ll see a results screen with your ending balance, totals approved/declined/missed, Quality Index, Frugality Index and a brief recommendation.

### Soft Goals

Meeting certain spending thresholds improves your Quality Index:

- **Groceries:** Spend at least ₹2 000 in total
- **Transport:** Spend at least ₹1 000 in total
- **Utilities:** Pay at least one bill

Overspending on discretionary categories can hurt your Frugality Index, for example multiple impulse buys or dining bills far above ₹1 500.

## Controls

| Platform | Approve | Decline | Pause/Resume |
|---------|--------|---------|--------------|
| **Keyboard** | **A** | **D** | **Space** |
| **Mouse / Touch** | Click **Approve** or swipe right | Click **Decline** or swipe left | Click **Pause** button |

## Settings

Budget Blitz supports basic personalization. You can pass query string parameters to adjust the starting income and difficulty:

- `income` – Starting income in rupees, e.g. `?income=60000`
- `difficulty` – `easy`, `normal` or `hard` (affects spawn intensity)

On first play the game stores your last-used settings in `localStorage`. A minimal settings panel can be added (left as an exercise) to change reduced motion, sound, income and difficulty.

## Local Development

To run the game locally you can serve the repository with any static file server:

```sh
# Using http-server (install via npm -g http-server)    
npx http-server .

# Or using Python’s simple server
python3 -m http.server
```

Then open `http://localhost:8000/index.html` in your browser.

### Testing

Tests are written using Node’s built‑in assertions. Run them with:

```sh
npm install
npm test
```

The tests validate scoring logic and timer accuracy.

### Deployment

This project is configured to deploy automatically to GitHub Pages via the provided GitHub Actions workflow. On every push to the `main` branch the workflow:

1. Checks out the code
2. Installs Node
3. Runs the tests
4. Uploads the repository as a Pages artifact
5. Deploys to GitHub Pages

To enable Pages on your fork:

1. Go to **Settings → Pages**
2. Select **GitHub Actions** as the source
3. Save your changes

## Accessibility Notes

Budget Blitz aims to meet [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/Understanding/) guidelines. Screens are keyboard navigable and include ARIA labels. Progress meters include accessible names. Animations are disabled when users prefer reduced motion.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.