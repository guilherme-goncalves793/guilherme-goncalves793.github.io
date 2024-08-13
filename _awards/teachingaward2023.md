---
title: "Teaching Excellence Award"
issuer: "Instituto Superior Técnico"
collection: awards
permalink: /awards/teachingexcelence2023
awarded: 2024-05-23
---

{% if page.awarded %}
  <p class="page__date"><strong><i class="fa fa-fw fa-calendar" aria-hidden="true"></i> {{ site.data.ui-text[site.locale].date_label | default: "Published:" }}</strong> <time datetime="{{ page.awarded | default: "1900-01-01" | date_to_xmlschema }}">{{ page.awarded | default: "1900-01-01" | date: "%B %d, %Y" }}</time></p>
{% endif %}
{% if page.issuer %}
    <p class="archive__item-excerpt" itemprop="description">Issuer: {{ page.issuer}}</p>
{% endif %}

I got the Teaching Excellence Award as a recognition of my job in teaching the Computer Networks course in the academic year of 2022/2023.
