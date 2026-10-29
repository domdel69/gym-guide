/* Bandeau affiché dans les versions archivées : rappelle qu’on n’est pas sur la dernière version. */
(function(){
  var m=location.pathname.match(/\/releases\/([^/]+)\//);if(!m)return;
  var b=document.createElement('div');b.className='archive-banner';
  b.innerHTML='<span>Version '+m[1]+' (archivée)</span><a href="../../">Revenir à la dernière version</a>';
  document.body.insertBefore(b,document.body.firstChild);
})();
