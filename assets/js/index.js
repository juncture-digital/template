let isMobile = ('ontouchstart' in document.documentElement && /mobi/i.test(navigator.userAgent) )
  
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

let selectors = ['.post-content', '.page-content', 'body']
if (document.getElementById('junctureScript')?.dataset.selector) selectors = [document.getElementById('junctureScript').dataset.selector, ...selectors]
for (let selector of selectors) {
  let el = document.querySelector(selector)
  if (el) {
    document.body.style.opacity = 0;
    document.body.transition = 'opacity 0.5s ease-in-out';
    let restructured = restructureMarkdownToSections(el)
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
  let path = pageData.path.replace(/^_/, '').replace(/\/index\.md$/, '')
  src.pathname = `${path}/${name}`
  img.src = src.toString()
});