---
title: "Academic Merit Award"
issuer: "Instituto Superior Técnico"
collection: awards
permalink: /awards/academicmerit2122
awarded: 2023-05-23
---

{% if page.awarded %}
  <p class="page__date"><strong><i class="fa fa-fw fa-calendar" aria-hidden="true"></i> {{ site.data.ui-text[site.locale].date_label | default: "Published:" }}</strong> <time datetime="{{ page.awarded | default: "1900-01-01" | date_to_xmlschema }}">{{ page.awarded | default: "1900-01-01" | date: "%B %d, %Y" }}</time></p>
{% endif %}

{% if page.issuer %}
    <p class="archive__item-excerpt" itemprop="description">Issuer: {{ page.issuer}}</p>
{% endif %}

I was awarded the Academic Merit award diploma for my results during the academic year of 2021/2022.

![Academic Merit Award](../files/merit_20212022.png)
