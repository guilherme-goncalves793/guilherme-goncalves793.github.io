---
title: "Master Thesis"
collection: publications
category: thesis
permalink: /publication/master_thesis
excerpt: 'Still being developed'
date: 2024-01-12
# paperurl: 'https://guilherme-goncalves793.github.io/files/master_thesis_proposal.pdf'
# slidesurl: 'http://academicpages.github.io/files/PIC2-presentation.pptx'
---

{% if page.date %}
  <p class="page__date"><strong><i class="fa fa-fw fa-calendar" aria-hidden="true"></i> {{ site.data.ui-text[site.locale].date_label | default: "Published:" }}</strong> <time datetime="{{ page.date | default: "1900-01-01" | date_to_xmlschema }}">{{ page.date | default: "1900-01-01" | date: "%B %d, %Y" }}</time></p>
{% endif %}