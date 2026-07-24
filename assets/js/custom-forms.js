/* ================================================
   KLOZET KAARAN — Customized Gifts & Bulk Order forms
   ================================================
   Both forms hand off to WhatsApp instead of needing an
   email service or file-upload backend — same pattern
   already used for checkout (assets/js/cart.js). Customers
   attach any photos/artwork directly in the WhatsApp chat
   itself once it opens, since there's no server-side file
   storage wired up yet.
================================================ */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "919025130407"; // same number used everywhere else on the site

  function sendToWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  }

  /* ---------- Customized Gifts Hamper form ---------- */
  const giftForm = document.getElementById("giftHamperForm");
  if (giftForm) {
    const occasionSelect = document.getElementById("ghOccasion");
    const occasionOtherGroup = document.getElementById("ghOccasionOtherGroup");

    if (occasionSelect) {
      occasionSelect.addEventListener("change", function () {
        occasionOtherGroup.style.display = this.value === "Other" ? "block" : "none";
      });
    }

    giftForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const val = (id) => (document.getElementById(id)?.value || "").trim();
      const occasion = val("ghOccasion") === "Other" ? val("ghOccasionOther") || "Other" : val("ghOccasion");

      let message = "Hey KLOZET KAARAN, I'd like to enquire about a Customized Gift Hamper:\n\n";
      message += `Couple's Names: ${val("ghName1")} & ${val("ghName2")}\n`;
      message += `Occasion: ${occasion}\n`;
      message += `Special Date: ${val("ghDate")}\n`;
      message += `Budget: ${val("ghBudget")}\n`;
      message += `T-Shirt Size — Him: ${val("ghSizeHim")}, Her: ${val("ghSizeHer")}\n`;
      if (val("ghTextHim") || val("ghTextHer")) {
        message += `Custom Text — His: "${val("ghTextHim") || "-"}", Hers: "${val("ghTextHer") || "-"}"\n`;
      }
      if (val("ghMessage")) {
        message += `Personal Message: ${val("ghMessage")}\n`;
      }
      message += `QR Surprise: ${val("ghQr")}\n\n`;
      message += `Delivery to: ${val("ghRecipientName")}\n`;
      message += `Mobile: ${val("ghMobile")}\n`;
      message += `Address: ${val("ghAddress")}\n\n`;
      message += "I'll attach reference photos here in the chat.";

      sendToWhatsApp(message);
    });
  }

  /* ---------- Bulk Order / Customized T-Shirts form ---------- */
  const bulkForm = document.getElementById("bulkOrderForm");
  if (bulkForm) {
    bulkForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const clickedBtn = e.submitter; // the specific button that was clicked
      const intent = clickedBtn ? clickedBtn.getAttribute("data-intent") : "quote";

      const val = (id) => (document.getElementById(id)?.value || "").trim();

      let message = intent === "order"
        ? "Hey KLOZET KAARAN, I'd like to place a Bulk Order:\n\n"
        : "Hey KLOZET KAARAN, I'd like to request a quote for a bulk/customized T-shirt order:\n\n";

      message += `Name: ${val("boName")}\n`;
      message += `Contact: ${val("boContact")}\n`;
      if (val("boCompany")) message += `Company: ${val("boCompany")}\n`;
      message += `Quantity: ${val("boQuantity")}\n`;
      message += `Design Requirement: ${val("boDesign")}\n\n`;
      message += "I'll attach my logo/artwork/reference images here in the chat.";

      sendToWhatsApp(message);
    });
  }
})();
