import 'https://cdn.jsdelivr.net/npm/js-md5@0.8.3/src/md5.min.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/button/button.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/card/card.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/carousel/carousel.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/carousel-item/carousel-item.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/copy-button/copy-button.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/dialog/dialog.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/dropdown/dropdown.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/tab/tab.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/tab-group/tab-group.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace/cdn/components/tab-panel/tab-panel.js';let isMobile = ('ontouchstart' in document.documentElement && /mobi/i.test(navigator.userAgent) )
  
/**
 * Restructure an HTML element (generated from Markdown) so that each heading
 * and its following content are wrapped in nested <section> elements according to heading level.
 * Additionally, any id, class, or style attributes applied to a heading (using Kramdown IAL syntax)
 * are transferred to the corresponding section.
 *
 * @param {element} contentEl - The HTML element from your Markdown.
 * @returns {element} - The new HTML element with nested sections.
 */
const restructureMarkdownToSections = (contentEl) => {
  // Create a container element to hold the content.
  const container = document.createElement(contentEl.tagName);

  if (contentEl.id) container.id = contentEl.id
  if (contentEl.className) container.className = contentEl.className
  if (contentEl.getAttribute('style')) container.setAttribute('style', contentEl.getAttribute('style'))
  container.innerHTML = contentEl.innerHTML;

  // Convert paragraphs with only hashtags into headings.
  Array.from(container.querySelectorAll('p'))
    .filter(p => /^#+\s*$/.test(p.textContent))
    .forEach(p => {
      let heading = document.createElement(`h${p.textContent.match(/^#+/)[0].length}`);
      // Transfer any id, class, and style attributes from the heading to the section.
      ['id', 'class', 'style'].forEach(attr => {
        if (p.hasAttribute(attr)) heading.setAttribute(attr, p.getAttribute(attr));
      });
      p.replaceWith(heading)
    })
  
  // Use a stack to keep track of the current section levels.
  // The stack starts with the container (level 0).
  const stack = [{ level: 0, element: container }];
  
  // Get a static list of the container’s children.
  const nodes = Array.from(container.childNodes);
  
  nodes.forEach(node => {
    // Check if the node is an element
    if (node.nodeType === Node.ELEMENT_NODE) {

      // Pop stack if the node is a closing section tag (e.g., ^#)
      if (/^\^#+\s*$/.test(node.textContent)) {
        let endOfSectionNumber = node.textContent.slice(1).trim().length
        node.style.display = 'none'
        while (stack.length > 0 && stack[stack.length - 1].level >= endOfSectionNumber) stack.pop();
      }

      // Check if heading (H1 - H6)
      if (/^H[1-6]$/.test(node.tagName)) {
        node.textContent = node.textContent.replace(/^\s+$/, '')
        // Determine the heading level (e.g., "H2" -> 2)
        const headingLevel = parseInt(node.tagName[1], 10);
        
        // Pop sections from the stack until we find one with a lower level.
        while (stack.length > 0 && stack[stack.length - 1].level >= headingLevel) {
          stack.pop();
        }
        
        // Create a new section and move the heading into it.
        const section = document.createElement('section');
        
        // Transfer any id, class, and style attributes from the heading to the section.
        ['id', 'class', 'style'].forEach(attr => {
          if (node.hasAttribute(attr)) {
            section.setAttribute(attr, node.getAttribute(attr));
            node.removeAttribute(attr);
          }
        });
        section.classList.add(`section${headingLevel}`)

        // Add "Back to top" link to section heading
        // if (section.id) node.innerHTML = '<a href="#top" title="Back to top" style="font-size:80%; text-decoration: none;">⬆</a> ' + node.innerHTML
      
        // Move the heading into the new section.
        section.appendChild(node);

        // Append the new section to the element at the top of the stack.
        stack[stack.length - 1].element.appendChild(section);
        
        // Push the new section onto the stack with its heading level.
        stack.push({ level: headingLevel, element: section });

      } else {
        // For non-heading nodes, append them to the current (top of the stack) section.
        stack[stack.length - 1].element.appendChild(node);
      }
    }
  });

  // if (!isMobile) {
    container.querySelectorAll('section.wrap').forEach(section => {
      const heading = section.firstElementChild;
      if (!heading) return;

      // Find all direct children (paragraphs, blockquotes, iframes, lists, subsections, etc).
      // The :scope pseudo-class ensures we only select direct children of `section`.
      const children = section.querySelectorAll(':scope > *');

      if (children.length > 1) {
        // Get the very last candidate from the list.
        const lastElementToMove = children[children.length - 1];

        // Use the .after() method to move the last element to be
        // immediately after the heading. This is a clean, modern way to re-insert nodes.
        heading.after(lastElementToMove);
      }
    });
  // }

  container.querySelector('hr.footnotes-sep')?.remove()
  let footnotes = container.querySelector('section.footnotes')
  if (footnotes) container.appendChild(footnotes)

  // return container.innerHTML;
  return container
}

function mwImage(mwImg, width) {
  width = width || 0
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = mwImg.replace(/^wc:/,'').replace(/Special:FilePath\//, 'File:').split('File:').pop()
  mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
  const _md5 = md5(mwImg)
  const extension = mwImg.split('.').pop()
  let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
  url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
  if (width > 0) {
    url += `/${width}px-${mwImg}`
    if (extension === 'svg') {
      url += '.png'
    } else if (extension === 'tif' || extension === 'tiff') {
      url += '.jpg'
    }
  }
  return url
}

/**
 * Convert sub-sections inside a '.cards' section into a responsive grid of Shoelace cards.
 * Each card uses:
 * - The sub-section heading as the card header.
 * - The first image as the card image.
 * - All paragraphs and lists as the card content.
 */
const makeCards = (rootEl) => {
  rootEl.querySelectorAll('section.cards').forEach(cardsSection => {

    // Create a container for the card grid.
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';

    // Get all direct sub-sections within the cards section (skip the main heading).
    const subsections = Array.from(cardsSection.querySelectorAll('section'));

    subsections.forEach(sub => {
      // Create a new sl-card element.
      const card = document.createElement('sl-card');

      // --- Card Header ---
      const subHeading = sub.querySelector('h1, h2, h3, h4, h5, h6');
      const firstLink = sub.querySelector('a[href]');
      const title = firstLink?.innerHTML || `<strong>${subHeading.textContent}</strong>`

      if (subHeading) {
        const header = document.createElement('div');
        header.setAttribute('slot', 'header');
        
        if (firstLink) {
          const link = document.createElement('a');
          link.href = firstLink.getAttribute('href');
          link.innerHTML = title;
          header.appendChild(link);
          firstLink.parentElement.remove()
        } else {
          header.innerHTML = title;
        }
        card.appendChild(header);
      }

      // --- Card Image ---
      const image = sub.querySelector('img');
      if (image) {
        if (image.src.startsWith('wc:')) image.src = mwImage(image.src, 300)
        let imgParent = image.parentElement
        image.setAttribute('slot', 'image');
        card.appendChild(image);
        imgParent.remove()
      }

      // --- Card Content ---
      // Create a container for any paragraphs or lists.
      const contentWrapper = document.createElement('div');
      // Gather any paragraphs or lists (skip headings and images)
      const contentElements = Array.from(sub.children).filter(el => {
        return !/^H[1-6]$/.test(el.tagName) && el.tagName.toLowerCase() !== 'img';
      });
      if (contentElements.length > 1) {
        let details = document.createElement('details')
        contentWrapper.appendChild(details)
        let summary = document.createElement('summary')
        summary.innerHTML = contentElements[0].innerHTML
        details.appendChild(summary)
        for (let i = 1; i < contentElements.length; i++) {
          details.appendChild(contentElements[i].cloneNode(true))
        }
      } else {
        contentElements.forEach(el => {
          contentWrapper.appendChild(el.cloneNode(true));
        });      
      }
      card.appendChild(contentWrapper);

      // Add the card to the grid.
      cardGrid.appendChild(card);
    });

    // Optionally, remove the original sub-sections.
    subsections.forEach(sub => sub.remove());

    // Append the card grid to the cards section.
    cardsSection.appendChild(cardGrid);
  })
}

const makeTabs = (rootEl) => {
  rootEl.querySelectorAll('section.tabs').forEach(section => {
    let tabGroup = document.createElement('sl-tab-group');
    Array.from(section.classList).forEach(cls => tabGroup.classList.add(cls))
    Array.from(section.attributes).forEach(attr => tabGroup.setAttribute(attr.name, attr.value))
    
    Array.from(section.querySelectorAll(':scope > section'))
    .forEach((tabSection, idx) => {
      let tab = document.createElement('sl-tab')
      tab.setAttribute('slot', 'nav')
      tab.setAttribute('panel', `tab${idx+1}`)
      if (idx === 0) tab.setAttribute('active', '')
      tab.innerHTML = tabSection.querySelector('h1, h2, h3, h4, h5, h6')?.innerHTML || ''
      tabGroup.appendChild(tab)      
    })

    Array.from(section.querySelectorAll(':scope > section'))
    .forEach((tabSection, idx) => {
      let tabPanel = document.createElement('sl-tab-panel')
      tabPanel.setAttribute('name', `tab${idx+1}`)
      if (idx === 0) tabPanel.setAttribute('active', '')
      let tabContent = Array.from(tabSection.children).slice(1).map(el => el.outerHTML).join(' ')
      tabPanel.innerHTML = tabContent
      tabGroup.appendChild(tabPanel)
      tabSection.remove()
    })

    // section.replaceWith(tabGroup)
    section.appendChild(tabGroup)
  })
}

let selectors = ['.post-content', '.page-content', 'body']
if (document.getElementById('junctureScript')?.dataset.selector) selectors = [document.getElementById('junctureScript').dataset.selector, ...selectors]
for (let selector of selectors) {
  let el = document.querySelector(selector)
  if (el) {
    document.body.style.opacity = 0;
    document.body.transition = 'opacity 0.5s ease-in-out';
    let restructured = restructureMarkdownToSections(el)
    makeCards(restructured)
    makeTabs(restructured)
    el.innerHTML = restructured.innerHTML
    document.body.style.opacity = 1
    break
  }
}

document.querySelectorAll('img').forEach((img) => {
  let src = new URL(img.src)
  if (location.origin !== src.origin) return
  let name = src.pathname.split('/').pop()
  if (['favicon.ico', 'favicon.png', 'favicon.svg'].includes(name)) return
  img.src = `https://raw.githubusercontent.com/${pageData.owner}/${pageData.repo}/main/${pageData.path.replace(/\/index.md/,'')}/${name}`
});

