<?php namespace App\Services; class OrderService { public function create(array $dados) { return new \App\Models\Order(); } }
