# Downloads all generated voice & SFX clips locally so the game
# no longer needs the CDN. Run from the game root or assets folder:
#   powershell -ExecutionPolicy Bypass -File assets\download_audio.ps1
$base = "https://d8j0ntlcm91z4.cloudfront.net/user_37DfdM6jwlG0p8AGJ2iHaA81mE3/"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force -Path "$root\va", "$root\sfx" | Out-Null

$va = @{
  "petras_1.wav" = "hf_20260613_004227_a82ef840-c18d-4dc3-90a0-379460f8565c.wav"
  "petras_2.wav" = "hf_20260613_004309_940d0d21-0699-40eb-bce9-e5303777d814.wav"
  "petras_3.wav" = "hf_20260613_004310_e1de4db8-418e-48da-873d-1ea8cb5b941a.wav"
  "petras_4.wav" = "hf_20260613_004312_d5301fdf-5805-43fb-9837-d8d61d840bd5.wav"
  "petras_5.wav" = "hf_20260613_004314_50027173-460d-4341-ada5-d90073b1e23f.wav"
  "geno_1.wav" = "hf_20260613_004315_34ee7e02-21ad-487a-ab38-3f488a13a697.wav"
  "geno_2.wav" = "hf_20260613_004316_18c5c26f-7239-46f7-93b4-417428254743.wav"
  "geno_3.wav" = "hf_20260613_004317_92abb917-8ebc-458f-a83a-d2f2f2af3857.wav"
  "geno_4.wav" = "hf_20260613_004319_29308468-00ee-4344-b133-b4a175bfa571.wav"
  "geno_5.wav" = "hf_20260613_004320_579f2ead-e124-4706-9c02-2e39e7b6f954.wav"
  "sen_1.wav" = "hf_20260613_004330_5ead6733-d743-414a-82bc-9c2dc379430b.wav"
  "sen_2.wav" = "hf_20260613_004331_2db2a3a0-8441-4253-810a-4808c90bcc16.wav"
  "sen_3.wav" = "hf_20260613_004333_0e8c0ca6-bacf-4d66-b546-b149f93fb5eb.wav"
  "mama_1.wav" = "hf_20260613_004334_b8142fa5-c552-48b7-879e-3d993f14b167.wav"
  "mama_2.wav" = "hf_20260613_004335_9afc4fb1-f57f-4508-b4a7-776438cfaf49.wav"
  "girl_1.wav" = "hf_20260613_004336_69353552-75b0-4d0a-913a-339f626e9d19.wav"
  "girl_2.wav" = "hf_20260613_004337_d4da3947-6557-497e-b002-ce6227d5e758.wav"
  "girl_3.wav" = "hf_20260613_004339_e884028b-f0dd-4c5d-a2fc-f67df46f03fc.wav"
  "girl_4.wav" = "hf_20260613_004340_be93350f-71ba-4ee1-9679-e0c588e58ea2.wav"
  "girl_5.wav" = "hf_20260613_004341_60d9ef77-a442-450c-a5df-16eafdd3e57f.wav"
  "kas_1.wav" = "hf_20260613_004344_1ed97e25-dbc1-420b-b5b0-dd1cf4489cba.wav"
  "kas_2.wav" = "hf_20260613_004432_2e65cd96-ddd6-4188-9f03-b2d50a87adda.wav"
  "bounce_1.wav" = "hf_20260613_004346_26990fec-a5d6-4dfb-ba14-9a80d105323e.wav"
  "deli_1.wav" = "hf_20260613_004430_faaa0c4b-bc40-48fb-b488-6ae2e39120f4.wav"
  "deli_2.wav" = "hf_20260613_004431_07293758-251d-4a2e-81ae-c69dc8ff6347.wav"
  "tv_1.wav" = "hf_20260613_000348_c899cfb7-9852-4c7b-abd1-db9609655775.wav"
  "tv_2.wav" = "hf_20260613_000349_184d3f8a-232a-4936-a286-1e5fcad38e5f.wav"
  "tv_3.wav" = "hf_20260613_000350_9c581c06-d5ac-4f1d-a86a-66d75e555861.wav"
  "tv_4.wav" = "hf_20260613_000351_d29cfd05-4ea1-465c-9df1-d0ac9775a0ed.wav"
  "lord_greet.wav" = "hf_20260613_035245_fa9ba417-bb38-49a4-a967-a6578b0a4878.wav"
  "lord_intro1.wav" = "hf_20260613_035246_888039bd-8ed2-4605-9171-d3b59005746d.wav"
  "lord_intro2.wav" = "hf_20260613_035247_23bd0175-ec72-4d6d-bbe5-efad59f31c6a.wav"
  "lord_collect.wav" = "hf_20260613_035248_1b21de29-4b25-42ed-bfc6-5d2ff391884c.wav"
  "lord_paid1.wav" = "hf_20260613_035249_dafd7792-d5a8-488c-b318-60d83b548acf.wav"
  "lord_paid2.wav" = "hf_20260613_035250_1310f617-94ac-41e5-adaf-258743df8abb.wav"
  "lord_nomoney1.wav" = "hf_20260613_035251_e5f26a07-347d-448e-bdf3-34a3795c075b.wav"
  "lord_nomoney2.wav" = "hf_20260613_035252_445c6179-d89e-4e71-bcb3-6ffa55c2c1c8.wav"
  "lord_linger1.wav" = "hf_20260618_084557_cf6942d8-ce32-4acd-bb15-1a08bab6af3b.wav"
  "lord_linger2.wav" = "hf_20260618_084601_fa7ab127-4f5b-46b6-a3fa-3d045d86b263.wav"
  "lord_linger3.wav" = "hf_20260618_084605_528352dd-7bb1-4a07-bd95-4ae18f3d71b1.wav"
  "lord_linger4.wav" = "hf_20260618_084619_3dcc7133-c876-4fa9-ae08-c999542fae73.wav"
  "lord_linger5.wav" = "hf_20260618_084625_d1cbb1df-61a8-4015-bcf3-c929f99399c3.wav"
  "lord_okay1.wav" = "hf_20260618_084646_14a14277-1a07-480d-80c2-3d02ad1ac639.wav"
  "lord_okay2.wav" = "hf_20260618_084649_453118b0-6a71-431b-bdaa-acb38d972d0d.wav"
  "lord_okay3.wav" = "hf_20260618_084652_d7025433-79d5-4201-a9a6-4c01a67fdc48.wav"
  "lord_ditch1.wav" = "hf_20260618_084657_faf3f235-4463-4ce6-902e-4fcba386db56.wav"
  "lord_ditch2.wav" = "hf_20260618_084703_fe942b90-8fa8-41e7-a702-4fb11a381a3a.wav"
}
$sfx = @{
  "pigeons.mp3" = "hf_20260613_004514_84deb236-73d1-41f1-96f4-79faddb65001.mp3"
  "trolley.mp3" = "hf_20260613_004515_f8c47439-880f-4178-8373-cca4798898ff.mp3"
  "taromat.mp3" = "hf_20260613_004516_cdd89ab4-b1ce-492f-8e0b-2f12335b85e1.mp3"
  "cat.mp3" = "hf_20260613_004517_1ea9689b-6afb-453a-8a8e-e1cc1c7606bb.mp3"
  "ball.mp3" = "hf_20260613_004518_b280a6e7-04fd-4025-b910-c9ef0c30ce87.mp3"
  "door.mp3" = "hf_20260613_004520_dfea6f54-ba82-44ad-a9e2-8aaa4e34ec85.mp3"
  "cardoor.mp3" = "hf_20260613_004605_94bb832e-817b-4538-bd3a-07449274f8ca.mp3"
  "ignition.mp3" = "hf_20260613_004606_bba317a0-a660-4b99-9748-99aa4ce0d5cc.mp3"
  "dog.mp3" = "hf_20260613_004607_c6d812c7-4712-4e87-9228-5a2f317de9cf.mp3"
  "amb_day.mp3" = "hf_20260613_004608_dead3571-048a-4c3c-8671-6403f42fcfc2.mp3"
  "amb_night.mp3" = "hf_20260613_004610_742d69b4-94a3-43d8-9165-1313d1abd7f9.mp3"
}
# Engine, skid, horn and brake are synthesized in audio.js (no files needed).
# Station songs (pop_*, rap_*, cls_*) are your own files in assets/radio/ — not downloaded here.
$radio = @{
  "djpop_1.wav" = "hf_20260613_011043_a268c62e-d968-4056-9a9c-219005a8230a.wav"
  "djpop_2.wav" = "hf_20260613_011044_b574a815-147e-49e4-ad37-d0687e0a3948.wav"
  "djpop_3.wav" = "hf_20260613_011045_dedcaeea-e692-45ec-bb21-7ffdc91f0758.wav"
  "djblok_1.wav" = "hf_20260613_011046_499fcfb6-2060-4e81-b984-d244a1341ea6.wav"
  "djblok_2.wav" = "hf_20260613_011047_cfead369-6582-46ca-af51-ad322f02eacd.wav"
  "djblok_3.wav" = "hf_20260613_011135_810ce78d-0314-45a5-bcd3-ee76ef058a0f.wav"
  "djcls_1.wav" = "hf_20260613_011136_489b9f64-436d-4088-983c-9a76ba947023.wav"
  "djcls_2.wav" = "hf_20260613_011138_35a051f1-846c-45b2-a488-7123b6a88e97.wav"
  "djcls_3.wav" = "hf_20260613_011139_fc4348e5-aafc-441f-9996-f0ef411aa0d5.wav"
}
New-Item -ItemType Directory -Force -Path "$root\radio" | Out-Null
foreach ($k in $va.Keys) { Invoke-WebRequest -Uri ($base + $va[$k]) -OutFile "$root\va\$k"; Write-Host "va\$k" }
foreach ($k in $sfx.Keys) { Invoke-WebRequest -Uri ($base + $sfx[$k]) -OutFile "$root\sfx\$k"; Write-Host "sfx\$k" }
foreach ($k in $radio.Keys) { Invoke-WebRequest -Uri ($base + $radio[$k]) -OutFile "$root\radio\$k"; Write-Host "radio\$k" }
Write-Host "Done. The game now plays everything locally."
