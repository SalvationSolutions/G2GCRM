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

  const csatForm = document.querySelector("[data-csat-form]");
  if (csatForm) {
    const status = csatForm.querySelector("[data-status]");
    const submitButton = csatForm.querySelector('button[type="submit"]');
    let savedUrl = "";
    try { savedUrl = localStorage.getItem("gtg_sheets_url") || ""; } catch (error) {}
    const apiUrl = String(params.get("api") || savedUrl).trim();
    const customerId = String(params.get("customerId") || "").trim().slice(0, 200);

    function validApiUrl(url) {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && /\/exec\/?$/.test(parsed.pathname);
      } catch (error) {
        return false;
      }
    }

    csatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.classList.remove("is-error");

      if (!validApiUrl(apiUrl)) {
        status.textContent = "This feedback link is not connected to the CRM. Please use the link from your GreekToGo email.";
        status.classList.add("is-error");
        return;
      }

      const data = new FormData(csatForm);
      const rating = Number(data.get("rating"));
      const comment = String(data.get("feedback") || "").trim().slice(0, 2000);
      const visitDate = String(data.get("date") || "").trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
        status.textContent = "Choose a rating and add your feedback before submitting.";
        status.classList.add("is-error");
        return;
      }

      const review = {
        id: `CSAT-WEB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customerId,
        orderId: "",
        date: visitDate || new Date().toISOString().slice(0, 10),
        overall: rating,
        food: rating,
        service: rating,
        ambiance: rating,
        value: rating,
        comment,
        recommend: rating >= 4,
        source: "Guest feedback page"
      };

      submitButton.disabled = true;
      submitButton.textContent = "Submitting…";
      status.textContent = "Saving your feedback…";

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "upsertCSAT", review }),
          redirect: "follow"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!result || result.status === "error") throw new Error(result?.message || "The CRM did not confirm the review.");
        csatForm.reset();
        submitButton.textContent = "Feedback submitted";
        status.textContent = "Thank you! Your feedback is now available in the GreekToGo CSAT tab.";
      } catch (error) {
        submitButton.disabled = false;
        submitButton.textContent = "Try submitting again";
        status.textContent = "We could not save your feedback. Please try again.";
        status.classList.add("is-error");
        console.error("CSAT submission failed:", error);
      }
    });
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
