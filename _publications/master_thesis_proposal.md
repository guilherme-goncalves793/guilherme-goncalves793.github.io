---
title: "Master Thesis Proposal"
collection: publications
category: thesis
permalink: /publication/master_thesis_proposal
excerpt: 'Describes the work I propose to do in my Master Thesis'
date: 2024-01-12
paperurl: 'https://guilherme-goncalves793.github.io/files/master_thesis_proposal.pdf'
slidesurl: 'http://academicpages.github.io/files/PIC2-presentation.pptx'
---

{% if page.date %}
  <p class="page__date"><strong><i class="fa fa-fw fa-calendar" aria-hidden="true"></i> {{ site.data.ui-text[site.locale].date_label | default: "Published:" }}</strong> <time datetime="{{ page.date | default: "1900-01-01" | date_to_xmlschema }}">{{ page.date | default: "1900-01-01" | date: "%B %d, %Y" }}</time></p>
{% endif %}

Abstract
======
  The World Wide Web, initially conceived for facilitating information sharing among CERN researchers, has evolved into a vital force driving social transformation and economic impact in our daily lives. JavaScript, a key programming language in web development, allows for dynamic and interactive content in browsers. Node.js further revolutionizes web development by extending JavaScript’s influence across the entire devel- opment stack, facilitating the creation of scalable websites. However, Node.js faces security challenges due to JavaScript’s language-specific behavior, leading to vulnerabilities often overlooked by developers. Addition- ally, the Node Package Manager (NPM) introduces risks, as its vast repository of community-managed packages may contain vulnerabilities. To address these issues, static analysis tools employing graph-based approaches, such as Graph.js and ODGen, have proven effective. This work focuses on enhancing Graph.js, acknowledging its limitations in modular reasoning, particularly regarding the handling of external modules. We propose two strategies, Complex Graph with Simple Queries and Simple Graph with Complex Queries, aiming to improve Graph.js’s accuracy by reducing false positives. The upgraded Graph.js version will be evaluated on SecBench and Vulcan datasets, comparing results with competitors ODGen and CodeQL. The anticipated outcome is an improved Graph.js, offering better support for modular reasoning and enhanced reliability in static analysis for Node.js applications. The goal is to strengthen Graph.js, making it a more reliable tool for static analysis in Node.js applications that can be integrated in the CI/CD pipelines. The document provides background infor- mation in Section 2, outlines related work in Section 3, details the proposed solution in Section 4, presents the evaluation and planning methods in Section 5, and concludes with a summary and remarks in Section 6.