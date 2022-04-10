create table rss_copy(id integer unique primary key autoincrement, link text NOT NULL unique, last text NOT NULL, name text NOT NULL unique);
insert into rss_copy(link, last, name) select link, last, name from rss;
drop table rss;
alter table rss_copy rename to rss;
