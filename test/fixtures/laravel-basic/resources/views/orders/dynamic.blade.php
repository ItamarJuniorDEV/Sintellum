@include($partial)
<x-dynamic-component :component="$component" />
<a href="{{ route($routeName) }}">Abrir</a>
