(() => {
  const params = new URLSearchParams(window.location.search);

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const box = document.createElement("textarea");
      box.value = text;
      box.setAttribute("readonly", "");
      box.style.position = "fixed";
      box.style.opacity = "0";
      document.body.appendChild(box);
      box.select();
      const copied = document.execCommand("copy");
      box.remove();
      return copied;
    }
  }

  document.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  const codeOutput = document.querySelector("[data-offer-code]");
  const codeButton = document.querySelector("[data-copy-code]");
  if (codeOutput && codeButton) {
    const rawCode = params.get("code") || "";
    const code = /^[A-Za-z0-9_-]{4,32}$/.test(rawCode) ? rawCode.toUpperCase() : "";
    if (code) {
      codeOutput.textContent = code;
      codeButton.hidden = false;
      codeButton.addEventListener("click", async () => {
        const copied = await copyText(code);
        const status = document.querySelector("[data-status]");
        codeButton.textContent = copied ? "Code copied" : "Select the code above";
        if (status) status.textContent = copied ? "Your personal offer code is ready to paste or show at GreekToGo." : "Copy the selected code using your device's copy command.";
      });
    }
  }

  const tierOutput = document.querySelector("[data-member-tier]");
  const visitsOutput = document.querySelector("[data-member-visits]");
  if (tierOutput || visitsOutput) {
    const validTiers = new Set(["Bronze", "Silver", "Gold", "Platinum"]);
    const rawTier = params.get("tier") || "";
    const tier = [...validTiers].find((item) => item.toLowerCase() === rawTier.toLowerCase()) || "Member";
    const rawVisits = params.get("visits") || "";
    const visits = /^\d{1,4}$/.test(rawVisits) ? String(Math.min(Number(rawVisits), 9999)) : "—";
    if (tierOutput) tierOutput.textContent = tier;
    if (visitsOutput) visitsOutput.textContent = visits;
  }

  document.querySelectorAll("[data-copy-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const lines = [form.dataset.copyHeading || "GreekToGo request"];
      form.querySelectorAll("[data-copy-label]").forEach((field) => {
        if ((field.type === "radio" || field.type === "checkbox") && !field.checked) return;
        const value = String(field.value || "").trim();
        if (value) lines.push(`${field.dataset.copyLabel}: ${value}`);
      });
      const copied = await copyText(lines.join("\n"));
      const status = form.querySelector("[data-status]");
      if (status) status.textContent = copied ? "Copied. Reply to your GreekToGo email and paste these details." : "Select the details and copy them using your device's copy command.";
    });
  });
})();
