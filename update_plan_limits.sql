  -- Plan limitlerini doğru değerlerle güncelle
  UPDATE public.plan_limits SET 
      analysis_limit = 1,
      citation_limit = 5, 
      abstract_limit = 1
  WHERE plan_name = 'free';

  UPDATE public.plan_limits SET 
      analysis_limit = 50,
      citation_limit = 100,
      abstract_limit = 20  
  WHERE plan_name = 'pro';

  UPDATE public.plan_limits SET 
      analysis_limit = -1,
      citation_limit = -1,
      abstract_limit = -1
  WHERE plan_name = 'expert';

  -- Güncellenmiş değerleri kontrol et
  SELECT * FROM public.plan_limits ORDER BY plan_name;
