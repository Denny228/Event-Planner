import VueRouter from "vue-router";

/**
 * vue-router 3 odbija promise kad guard preusmjeri — to nije stvarna greška.
 */
function jeIgnoriranaNavigacijskaGreska(greska) {
  if (!greska) {
    return true;
  }

  if (
    typeof VueRouter.isNavigationFailure === "function" &&
    VueRouter.isNavigationFailure(greska)
  ) {
    return true;
  }

  const poruka = greska.message || "";

  return (
    greska.name === "NavigationDuplicated" ||
    poruka.includes("Redirected") ||
    poruka.includes("Avoided redundant navigation")
  );
}

/**
 * replace nakon prijave/registracije — bez uncaught redirect greške u konzoli.
 */
export function sigurnaNavigacija(router, lokacija) {
  return router.replace(lokacija).catch((greska) => {
    if (!jeIgnoriranaNavigacijskaGreska(greska)) {
      return Promise.reject(greska);
    }
  });
}

/**
 * Globalni patch push/replace na router instanci (odjava, linkovi, itd.).
 */
export function postaviSigurnuNavigaciju(router) {
  const originalniPush = router.push.bind(router);
  const originalniReplace = router.replace.bind(router);

  router.push = function sigurniPush(lokacija, onResolve, onReject) {
    if (onResolve || onReject) {
      return originalniPush(lokacija, onResolve, onReject);
    }

    return originalniPush(lokacija).catch((greska) => {
      if (jeIgnoriranaNavigacijskaGreska(greska)) {
        return greska;
      }
      throw greska;
    });
  };

  router.replace = function sigurniReplace(lokacija, onResolve, onReject) {
    if (onResolve || onReject) {
      return originalniReplace(lokacija, onResolve, onReject);
    }

    return originalniReplace(lokacija).catch((greska) => {
      if (jeIgnoriranaNavigacijskaGreska(greska)) {
        return greska;
      }
      throw greska;
    });
  };
}
