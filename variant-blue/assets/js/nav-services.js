/**
 * Open the Services panel from anywhere on its row, on desktop.
 *
 * The row used to be one control: the word "Services" and the chevron both belonged to
 * the dropdown toggle, so there was no way to reach the Services page from the menu — you
 * could only expand it. The word is now a link and the chevron is the toggle, which fixes
 * that but leaves the chevron as the only thing that opens the panel, and nobody aims for
 * a 20px chevron when the word next to it is what they are looking at.
 *
 * So on desktop the panel opens when the pointer enters the row. The dropdown is marked
 * data-hover, and the nav runtime listens for that on the toggle itself; this just passes
 * the row's own enter and leave along to it. Below 992px the menu is collapsed and there
 * is no hover to speak of, so nothing here applies and the chevron does the work.
 *
 * Include with:  <script src="assets/js/nav-services.js" defer></script>
 */
(function () {
  'use strict';

  var row = document.querySelector('.navbar_dropdown');
  if (!row) return;
  var toggle = row.querySelector('.w-dropdown-toggle');
  if (!toggle) return;

  var desktop = window.matchMedia('(min-width: 992px)');

  /* mouseenter and mouseleave are not what actually gets listened for. jQuery implements
     both on top of mouseover and mouseout, working out enter and leave from relatedTarget,
     so a synthetic mouseenter reaches nothing — this was dispatching into the void until
     it was checked in a browser. Sending mouseover with a relatedTarget outside the toggle
     is what jQuery reads as an enter. */
  function forward(type) {
    return function (e) {
      if (!desktop.matches) return;
      // The chevron's own hover already did this; repeating it would toggle the panel a
      // second time on the same movement.
      if (toggle === e.target || toggle.contains(e.target)) return;
      toggle.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          // Outside the toggle either way, which is what makes it read as a crossing.
          relatedTarget: e.relatedTarget && !toggle.contains(e.relatedTarget)
            ? e.relatedTarget
            : document.body,
        })
      );
    };
  }

  // The panel is a child of the row, so moving the pointer down into it does not count
  // as leaving — which is what keeps the menu open while you read it.
  row.addEventListener('mouseenter', forward('mouseover'));
  row.addEventListener('mouseleave', forward('mouseout'));
})();
